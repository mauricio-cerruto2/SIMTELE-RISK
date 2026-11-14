
/* =====================================================
   SIMTELE-RISK
   MODULO 2: DETERIORO MECANICO Y MANTENIMIENTO
   ===================================================== */

   const Modulo2 = {

    // Datos sintéticos para fines educativos.
    escenarios: {
        NORMAL: {
            D0: 5,
            alfa: 0.8,
            beta: 0.025,
            umbral: 25,
            tiempoMaximo: 30,
            tolerancia: 1e-8,
            maxIteraciones: 1000,
            perturbacion: 0.01
        },

        ESTRES: {
            D0: 8,
            alfa: 1.5,
            beta: 0.06,
            umbral: 45,
            tiempoMaximo: 25,
            tolerancia: 1e-10,
            maxIteraciones: 1500,
            perturbacion: 0.05
        },

        MAL_CONDICIONADO: {
            D0: 4,
            alfa: 0.15,
            beta: 0.002,
            umbral: 20,
            tiempoMaximo: 150,
            tolerancia: 1e-12,
            maxIteraciones: 3000,
            perturbacion: 0.1
        }
    },

    // Sistema SPD 4x4 para estimar los coeficientes
    // del modelo cuadrático mediante mínimos cuadrados
    // regularizados con datos sintéticos.
    construirSistema(nombreEscenario) {

        if (nombreEscenario === "MAL_CONDICIONADO") {
            return {
                A: [
                    [1, 0, 0, 0],
                    [0, 0.01, 0, 0],
                    [0, 0, 0.0001, 0],
                    [0, 0, 0, 0.000001]
                ],
                b: [5, 0.8, 0.025, 0.001]
            };
        }

        if (nombreEscenario === "ESTRES") {
            return {
                A: [
                    [10, 2, 1, 0],
                    [2, 9, 2, 1],
                    [1, 2, 8, 2],
                    [0, 1, 2, 7]
                ],
                b: [15, 20, 25, 30]
            };
        }

        return {
            A: [
                [8, 1, 0, 0],
                [1, 7, 1, 0],
                [0, 1, 6, 1],
                [0, 0, 1, 5]
            ],
            b: [10, 12, 15, 18]
        };
    },

    validar(datos) {
        const valores = [
            datos.D0,
            datos.alfa,
            datos.beta,
            datos.umbral,
            datos.tiempoMaximo,
            datos.tolerancia,
            datos.maxIteraciones,
            datos.perturbacion
        ];

        if (!valores.every(Number.isFinite)) {
            throw new Error("Todos los parámetros deben ser numéricos.");
        }

        if (
            datos.D0 < 0 ||
            datos.alfa < 0 ||
            datos.beta < 0 ||
            datos.umbral <= datos.D0 ||
            datos.tiempoMaximo <= 0 ||
            datos.tolerancia <= 0 ||
            datos.maxIteraciones < 1
        ) {
            throw new Error("Los parámetros del deterioro no son válidos.");
        }

        return true;
    },

    obtenerEscenario(nombre, cambios = {}) {
        const base = this.escenarios[nombre];

        if (!base) {
            throw new Error("Escenario del módulo 2 no válido.");
        }

        const datos = { ...base, ...cambios };
        this.validar(datos);

        return datos;
    },

    // MODELO MATEMÁTICO:
    // D(t) = D0 + alfa*t + beta*t²
    calcularDeterioro(datos, t) {
        return datos.D0 +
            datos.alfa * t +
            datos.beta * t * t;
    },

    // SOLUCIÓN ANALÍTICA DE REFERENCIA
    calcularAnalitico(datos) {
        const D0 = datos.D0;
        const a = datos.alfa;
        const b = datos.beta;
        const umbral = datos.umbral;

        let tiempo;

        if (Math.abs(b) < 1e-14) {
            tiempo = (umbral - D0) / a;
        } else {
            const discriminante =
                a * a + 4 * b * (umbral - D0);

            if (discriminante < 0) {
                throw new Error("No existe una raíz real para el umbral.");
            }

            tiempo =
                (-a + Math.sqrt(discriminante)) / (2 * b);
        }

        return {
            tiempoUmbral: tiempo,
            deterioroUmbral: this.calcularDeterioro(datos, tiempo),
            deterioroInicial: D0,
            deterioroFinal: this.calcularDeterioro(datos, datos.tiempoMaximo)
        };
    },

    // MÉTODOS NUMÉRICOS PARA ENCONTRAR EL TIEMPO
    // EN QUE EL DETERIORO ALCANZA EL UMBRAL.
    calcularRaices(datos, referencia) {
        const f = t =>
            this.calcularDeterioro(datos, t) - datos.umbral;

        const df = t =>
            datos.alfa + 2 * datos.beta * t;

        let limite = Math.max(
            datos.tiempoMaximo,
            referencia.tiempoUmbral * 1.5 + 1
        );

        const biseccion = Numericos.biseccion(
            f,
            0,
            limite,
            datos.tolerancia,
            datos.maxIteraciones
        );

        const newton = Numericos.newton(
            f,
            df,
            Math.max(0, referencia.tiempoUmbral * 0.8),
            datos.tolerancia,
            datos.maxIteraciones
        );

        const secante = Numericos.secante(
            f,
            0,
            limite,
            datos.tolerancia,
            datos.maxIteraciones
        );

        return {
            referencia: referencia.tiempoUmbral,
            biseccion: biseccion.raiz,
            newton: newton.raiz,
            secante: secante.raiz,
            resultados: {
                biseccion,
                newton,
                secante
            },
            errores: {
                biseccion: Errores.absoluto(
                    referencia.tiempoUmbral, biseccion.raiz
                ),
                newton: Errores.absoluto(
                    referencia.tiempoUmbral, newton.raiz
                ),
                secante: Errores.absoluto(
                    referencia.tiempoUmbral, secante.raiz
                )
            }
        };
    },

    // RESOLUCIÓN DEL SISTEMA LINEAL
    // COMPARACIÓN DE CUATRO MÉTODOS.
    calcularSistema(nombreEscenario, datos) {
        const sistema = this.construirSistema(nombreEscenario);
        const A = sistema.A;
        const b = sistema.b;

        const tolerancia = datos.tolerancia;
        const maxIter = datos.maxIteraciones;

        const jacobi = Numericos.jacobi(
            A, b, tolerancia, maxIter
        );

        const gaussSeidel = Numericos.gaussSeidel(
            A, b, tolerancia, maxIter
        );

        const lu = Numericos.lu(A, b);

        const gradiente = Numericos.gradienteConjugado(
            A, b, tolerancia, maxIter
        );

        const referencia = lu.solucion;

        const comparar = (nombre, resultado) => ({
            metodo: nombre,
            solucion: resultado.solucion,
            iteraciones: resultado.iteraciones ?? 0,
            convergio: resultado.convergio ?? true,
            residual: Numericos.normaVector(
                Numericos.residual(A, resultado.solucion, b)
            ),
            errorAbsoluto: Errores.errorVectorial(
                referencia,
                resultado.solucion
            )
        });

        return {
            matriz: A,
            vector: b,
            referencia,
            jacobi: comparar("Jacobi", jacobi),
            gaussSeidel: comparar("Gauss-Seidel", gaussSeidel),
            lu: comparar("LU", lu),
            gradienteConjugado: comparar(
                "Gradiente conjugado", gradiente
            ),
            tablas: {
                jacobi: jacobi.tabla,
                gaussSeidel: gaussSeidel.tabla,
                gradienteConjugado: gradiente.tabla
            },
            residualReferencia: Numericos.normaVector(
                Numericos.residual(A, referencia, b)
            )
        };
    },

    // ESTUDIO DE SENSIBILIDAD
    analizarSensibilidad(datos, referencia) {
        const perturbado = {
            ...datos,
            D0: datos.D0 + datos.perturbacion
        };

        const tiempoPerturbado =
            this.calcularAnalitico(perturbado).tiempoUmbral;

        return {
            perturbacion: datos.perturbacion,
            tiempoOriginal: referencia.tiempoUmbral,
            tiempoPerturbado,
            cambioAbsoluto: Errores.absoluto(
                referencia.tiempoUmbral,
                tiempoPerturbado
            ),
            cambioRelativo: Errores.sensibilidad(
                referencia.tiempoUmbral,
                tiempoPerturbado,
                datos.D0,
                perturbado.D0
            )
        };
    },

    // TABLA DE EVOLUCIÓN DEL DETERIORO
    construirTabla(datos, referencia) {
        const cantidad = 20;
        const tabla = [];

        for (let i = 0; i <= cantidad; i++) {
            const t = referencia.tiempoUmbral * i / cantidad;

            tabla.push({
                tiempo: t,
                deterioro: this.calcularDeterioro(datos, t),
                umbral: datos.umbral,
                diferencia: datos.umbral -
                    this.calcularDeterioro(datos, t)
            });
        }

        return tabla;
    },

    // TEORÍA DE ERRORES
    calcularTeoriaErrores(raices, sistema, sensibilidad) {
        const comparacionRaices = [
            {
                metodo: "Bisección",
                ...Errores.comparar(
                    raices.referencia, raices.biseccion
                ),
                residuo: raices.resultados.biseccion.residual
            },
            {
                metodo: "Newton-Raphson",
                ...Errores.comparar(
                    raices.referencia, raices.newton
                ),
                residuo: raices.resultados.newton.residual
            },
            {
                metodo: "Secante",
                ...Errores.comparar(
                    raices.referencia, raices.secante
                ),
                residuo: raices.resultados.secante.residual
            }
        ];

        const comparacionSistemas = [
            sistema.jacobi,
            sistema.gaussSeidel,
            sistema.lu,
            sistema.gradienteConjugado
        ].map(resultado => ({
            metodo: resultado.metodo,
            errorAbsoluto: resultado.errorAbsoluto,
            residual: resultado.residual,
            iteraciones: resultado.iteraciones,
            convergio: resultado.convergio
        }));

        return {
            comparacionRaices,
            comparacionSistemas,
            sensibilidad,
            interpretacion:
                "Los errores absolutos comparan cada aproximación con " +
                "la referencia analítica o directa. El residuo mide " +
                "el cumplimiento de las ecuaciones numéricas."
        };
    },

    // EJECUCIÓN COMPLETA
    ejecutar(nombreEscenario = "NORMAL", cambios = {}) {
        const datos = this.obtenerEscenario(
            nombreEscenario,
            cambios
        );

        const analitico = this.calcularAnalitico(datos);

        const raices = this.calcularRaices(
            datos,
            analitico
        );

        const sistema = this.calcularSistema(
            nombreEscenario,
            datos
        );

        const sensibilidad = this.analizarSensibilidad(
            datos,
            analitico
        );

        const tablaDeterioro = this.construirTabla(
            datos,
            analitico
        );

        const teoriaErrores = this.calcularTeoriaErrores(
            raices,
            sistema,
            sensibilidad
        );

        return {
            modulo: "Deterioro mecánico y mantenimiento",
            escenario: nombreEscenario,
            datos,
            modelo: "D(t) = D0 + alfa*t + beta*t²",
            analitico,
            raices,
            sistema,
            sensibilidad,
            tablaDeterioro,
            teoriaErrores
        };
    }
};

console.log("Módulo 2 cargado correctamente.");
