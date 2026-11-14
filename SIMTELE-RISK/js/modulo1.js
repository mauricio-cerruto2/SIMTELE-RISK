
const Modulo1 = {

    // Los valores son datos sintéticos para fines educativos.
    escenarios: {
        NORMAL: {
            velocidadInicial: 10,
            desaceleracion: 1.5,
            tiempoReaccion: 1,
            paso: 0.2,
            deltaVelocidad: 0.01
        },

        ESTRES: {
            velocidadInicial: 15,
            desaceleracion: 1,
            tiempoReaccion: 1.5,
            paso: 0.5,
            deltaVelocidad: 0.05
        },

        MAL_CONDICIONADO: {
            velocidadInicial: 10,
            desaceleracion: 0.05,
            tiempoReaccion: 1,
            paso: 0.2,
            deltaVelocidad: 0.1
        }
    },

    validar(datos) {
        const valores = [
            datos.velocidadInicial,
            datos.desaceleracion,
            datos.tiempoReaccion,
            datos.paso
        ];

        if (!valores.every(Number.isFinite)) {
            throw new Error("Todos los parámetros deben ser números válidos.");
        }

        if (
            datos.velocidadInicial <= 0 ||
            datos.desaceleracion <= 0 ||
            datos.tiempoReaccion < 0 ||
            datos.paso <= 0
        ) {
            throw new Error("Verifica los parámetros ingresados.");
        }

        return true;
    },

    obtenerEscenario(nombre, cambios = {}) {
        const base = this.escenarios[nombre];

        if (!base) {
            throw new Error("Escenario no válido.");
        }

        const datos = { ...base, ...cambios };

        this.validar(datos);

        return datos;
    },

    // SOLUCIÓN ANALÍTICA
    calcularAnalitico(datos) {
        const v0 = datos.velocidadInicial;
        const a = datos.desaceleracion;
        const tr = datos.tiempoReaccion;

        const tiempoFrenado = v0 / a;
        const distanciaFrenado = (v0 * v0) / (2 * a);
        const distanciaReaccion = v0 * tr;

        return {
            tiempoFrenado,
            distanciaFrenado,
            distanciaReaccion,
            tiempoTotal: tr + tiempoFrenado,
            distanciaTotal: distanciaReaccion + distanciaFrenado
        };
    },

    // ECUACIONES DIFERENCIALES:
    // dx/dt = v
    // dv/dt = -a
    construirTrayectoria(datos, metodo = "RK4") {
        const v0 = datos.velocidadInicial;
        const a = datos.desaceleracion;

        const tiempoDetencion = v0 / a;

        let n = Math.ceil(tiempoDetencion / datos.paso);
        n = Math.max(2, n);

        // Ajustamos el paso para llegar exactamente al instante de detención.
        const h = tiempoDetencion / n;

        const sistema = (t, estado) => {
            return [
                estado[1],
                -a
            ];
        };

        let estado = [0, v0];
        let tiempo = 0;

        const tabla = [];

        tabla.push({
            tiempo: 0,
            posicion: 0,
            velocidad: v0,
            posicionExacta: 0,
            velocidadExacta: v0,
            errorPosicion: 0,
            errorVelocidad: 0
        });

        for (let i = 1; i <= n; i++) {

            const resultado = metodo === "RK2"
                ? Numericos.rk2(sistema, tiempo, estado, h, 1)
                : Numericos.rk4(sistema, tiempo, estado, h, 1);

            estado = resultado.solucion;
            tiempo = i * h;

            const posicionExacta =
                v0 * tiempo - (a * tiempo * tiempo) / 2;

            const velocidadExacta =
                v0 - a * tiempo;

            tabla.push({
                tiempo,
                posicion: estado[0],
                velocidad: estado[1],
                posicionExacta,
                velocidadExacta,
                errorPosicion: Math.abs(
                    posicionExacta - estado[0]
                ),
                errorVelocidad: Math.abs(
                    velocidadExacta - estado[1]
                )
            });
        }

        return {
            metodo,
            paso: h,
            iteraciones: n,
            tabla,
            solucion: estado
        };
    },

    // INTEGRACIÓN NUMÉRICA DE LA VELOCIDAD
    calcularIntegrales(datos) {
        const v0 = datos.velocidadInicial;
        const a = datos.desaceleracion;

        const tiempoDetencion = v0 / a;

        const velocidad = t => v0 - a * t;

        let n = Math.max(
            2,
            Math.ceil(tiempoDetencion / datos.paso)
        );

        // Simpson compuesto requiere un número par de subintervalos.
        if (n % 2 !== 0) n++;

        const trapecio = Numericos.trapecio(
            velocidad, 0, tiempoDetencion, n
        );

        const simpson = Numericos.simpson(
            velocidad, 0, tiempoDetencion, n
        );

        const romberg = Numericos.romberg(
            velocidad, 0, tiempoDetencion, 6
        );

        const referencia = (v0 * v0) / (2 * a);

        return {
            referencia,
            trapecio: trapecio.integral,
            simpson: simpson.integral,
            romberg: romberg.integral,
            errores: {
                trapecio: Math.abs(referencia - trapecio.integral),
                simpson: Math.abs(referencia - simpson.integral),
                romberg: Math.abs(referencia - romberg.integral)
            },
            subintervalos: n
        };
    },

    // MÉTODOS PARA ENCONTRAR v(t) = 0
    calcularRaices(datos) {
        const v0 = datos.velocidadInicial;
        const a = datos.desaceleracion;

        const f = t => v0 - a * t;
        const df = t => -a;

        const tiempoExacto = v0 / a;

        const biseccion = Numericos.biseccion(
            f, 0, tiempoExacto * 2
        );

        const newton = Numericos.newton(
            f, df, tiempoExacto * 0.8
        );

        const secante = Numericos.secante(
            f, 0, tiempoExacto * 2
        );

        return {
            referencia: tiempoExacto,

            biseccion: biseccion.raiz,
            newton: newton.raiz,
            secante: secante.raiz,

            resultados: {
                biseccion,
                newton,
                secante
            },

            errores: {
                biseccion: Math.abs(tiempoExacto - biseccion.raiz),
                newton: Math.abs(tiempoExacto - newton.raiz),
                secante: Math.abs(tiempoExacto - secante.raiz)
            }
        };
    },

    // SENSIBILIDAD ANTE UNA PERTURBACIÓN DE VELOCIDAD
    analizarSensibilidad(datos) {
        const v0 = datos.velocidadInicial;
        const a = datos.desaceleracion;
        const deltaV = datos.deltaVelocidad;

        const tiempoOriginal = v0 / a;
        const tiempoPerturbado = (v0 + deltaV) / a;

        return {
            perturbacionVelocidad: deltaV,
            tiempoOriginal,
            tiempoPerturbado,
            cambioTiempo: Math.abs(
                tiempoPerturbado - tiempoOriginal
            ),
            estimacion: Math.abs(deltaV / a)
        };
    },
        // ==========================================
    // TEORÍA DE ERRORES DEL MÓDULO 1
    // ==========================================

    calcularTeoriaErrores(datos, rk2, rk4, integrales, raices) {

        const v0 = datos.velocidadInicial;
        const a = datos.desaceleracion;

        // Valores analíticos al finalizar el frenado
        const posicionExacta = (v0 * v0) / (2 * a);
        const velocidadExacta = 0;

        const finalRK2 = rk2.tabla[rk2.tabla.length - 1];
        const finalRK4 = rk4.tabla[rk4.tabla.length - 1];

        // Comparación de las EDO
        const comparacionRK = [
            {
                metodo: "RK2 - Posición",
                ...Errores.comparar(posicionExacta, finalRK2.posicion)
            },
            {
                metodo: "RK4 - Posición",
                ...Errores.comparar(posicionExacta, finalRK4.posicion)
            },
            {
                metodo: "RK2 - Velocidad",
                ...Errores.comparar(velocidadExacta, finalRK2.velocidad)
            },
            {
                metodo: "RK4 - Velocidad",
                ...Errores.comparar(velocidadExacta, finalRK4.velocidad)
            }
        ];

        // Comparación de integración
        const comparacionIntegracion = Errores.tablaComparacion(
            integrales.referencia,
            [
                { metodo: "Trapecio", valor: integrales.trapecio },
                { metodo: "Simpson 1/3", valor: integrales.simpson },
                { metodo: "Romberg", valor: integrales.romberg }
            ]
        );

        // Residuos de las ecuaciones de búsqueda de raíces
        const funcionVelocidad = t => v0 - a * t;

        const comparacionRaices = [
            {
                metodo: "Bisección",
                ...Errores.comparar(raices.referencia, raices.biseccion),
                residuo: Errores.residualRaiz(
                    funcionVelocidad, raices.biseccion
                )
            },
            {
                metodo: "Newton-Raphson",
                ...Errores.comparar(raices.referencia, raices.newton),
                residuo: Errores.residualRaiz(
                    funcionVelocidad, raices.newton
                )
            },
            {
                metodo: "Secante",
                ...Errores.comparar(raices.referencia, raices.secante),
                residuo: Errores.residualRaiz(
                    funcionVelocidad, raices.secante
                )
            }
        ];

        return {
            comparacionRK,
            comparacionIntegracion,
            comparacionRaices,

            sensibilidadAbsoluta: 1 / a,

            sensibilidadRelativa: Errores.sensibilidad(
                v0 / a,
                (v0 + datos.deltaVelocidad) / a,
                v0,
                v0 + datos.deltaVelocidad
            )
        };
    },

    // EJECUCIÓN COMPLETA DEL MÓDULO
    ejecutar(nombreEscenario = "NORMAL", cambios = {}) {

        const datos = this.obtenerEscenario(
            nombreEscenario,
            cambios
        );

        const analitico = this.calcularAnalitico(datos);

        const rk2 = this.construirTrayectoria(datos, "RK2");
        const rk4 = this.construirTrayectoria(datos, "RK4");

        const integrales = this.calcularIntegrales(datos);
        const raices = this.calcularRaices(datos);

        const sensibilidad = this.analizarSensibilidad(datos);

        const teoriaErrores = this.calcularTeoriaErrores(
            datos,
            rk2,
            rk4,
            integrales,
            raices
        );

        return {
            modulo: "Detención de emergencia",
            escenario: nombreEscenario,
            datos,
            analitico,
            rk2,
            rk4,
            integrales,
            raices,
            sensibilidad,
            teoriaErrores
        };
    }
};

console.log("Módulo 1 cargado correctamente.");
