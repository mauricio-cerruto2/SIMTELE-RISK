
const Modulo4 = {

    // Datos sintéticos para fines académicos.
    // Representan lecturas de un sensor de posición.

    escenarios: {
        NORMAL: {
            inicio: 0,
            fin: 10,
            cantidadNodos: 9,
            puntosOcultos: [2, 6],
            ruido: 0,
            tolerancia: 1e-8
        },

        ESTRES: {
            inicio: 0,
            fin: 10,
            cantidadNodos: 11,
            puntosOcultos: [3, 7],
            ruido: 0.03,
            tolerancia: 1e-8
        },

        MAL_CONDICIONADO: {
            inicio: 0,
            fin: 10,
            cantidadNodos: 15,
            puntosOcultos: [5, 9, 12],
            ruido: 0.08,
            tolerancia: 1e-10
        }
    },

    // Señal original simulada del sensor.
    // La función permite conocer los valores reales
    // para comparar los métodos de reconstrucción.

    senalOriginal(t) {
        return (
            2 +
            0.5 * Math.sin(0.8 * t) +
            0.15 * Math.cos(1.7 * t) +
            0.03 * t
        );
    },

    validar(datos) {
        if (
            !Number.isFinite(datos.inicio) ||
            !Number.isFinite(datos.fin) ||
            !Number.isInteger(datos.cantidadNodos) ||
            datos.cantidadNodos < 5 ||
            datos.fin <= datos.inicio ||
            !Number.isFinite(datos.ruido) ||
            datos.ruido < 0 ||
            !Array.isArray(datos.puntosOcultos)
        ) {
            throw new Error("Parámetros inválidos para reconstruir el sensor.");
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

    // CONSTRUCCIÓN DE LOS DATOS DEL SENSOR

    generarDatos(datos) {
        const x = [];
        const y = [];

        const paso =
            (datos.fin - datos.inicio) /
            (datos.cantidadNodos - 1);

        for (let i = 0; i < datos.cantidadNodos; i++) {
            const tiempo = datos.inicio + i * paso;

            const valorReal = this.senalOriginal(tiempo);

            // Perturbación sintética determinista.
            const perturbacion = datos.ruido *
                Math.sin(i * 2.31);

            x.push(tiempo);
            y.push(valorReal + perturbacion);
        }

        return { x, y, paso };
    },

    // SEPARACIÓN DE LECTURAS DISPONIBLES Y OCULTAS

    separarDatos(datos, conjunto) {
        const indicesOcultos = new Set(
            datos.puntosOcultos
        );

        conjunto.x.forEach((_, i) => {
            if (i < 0 || i >= conjunto.x.length) {
                throw new Error("Índice de punto oculto fuera de rango.");
            }
        });

        const xDisponibles = [];
        const yDisponibles = [];
        const ocultos = [];

        conjunto.x.forEach((valor, i) => {
            if (indicesOcultos.has(i)) {
                ocultos.push({
                    indice: i,
                    tiempo: valor,
                    valorReal: this.senalOriginal(valor)
                });
            } else {
                xDisponibles.push(valor);
                yDisponibles.push(conjunto.y[i]);
            }
        });

        if (xDisponibles.length < 3) {
            throw new Error("No hay suficientes lecturas disponibles.");
        }

        return {
            xDisponibles,
            yDisponibles,
            ocultos
        };
    },

    // RECONSTRUCCIÓN CON LAGRANGE, NEWTON Y SPLINES

    reconstruir(datos, conjunto) {
        const separados = this.separarDatos(
            datos,
            conjunto
        );

        const x = separados.xDisponibles;
        const y = separados.yDisponibles;

        const resultados = separados.ocultos.map(punto => {
            const lagrange = Numericos.lagrange(
                x, y, punto.tiempo
            );

            const newton = Numericos.newtonInterpolacion(
                x, y, punto.tiempo
            );

            const spline = Numericos.splineCubico(
                x, y, punto.tiempo
            );

            return {
                indice: punto.indice,
                tiempo: punto.tiempo,
                valorReal: punto.valorReal,

                lagrange: lagrange,
                newton: newton.valor,
                spline: spline,

                errorLagrange: Errores.absoluto(
                    punto.valorReal, lagrange
                ),

                errorNewton: Errores.absoluto(
                    punto.valorReal, newton.valor
                ),

                errorSpline: Errores.absoluto(
                    punto.valorReal, spline
                )
            };
        });

        return {
            datosDisponibles: {
                x,
                y
            },
            puntosOcultos: separados.ocultos,
            resultados
        };
    },

    // GENERACIÓN DE CURVAS PARA LOS GRÁFICOS

    generarCurvas(datos, conjunto, reconstruccion) {
        const x = reconstruccion.datosDisponibles.x;
        const y = reconstruccion.datosDisponibles.y;

        const cantidad = 101;
        const paso = (datos.fin - datos.inicio) /
            (cantidad - 1);

        const curvas = [];

        for (let i = 0; i < cantidad; i++) {
            const t = datos.inicio + i * paso;

            curvas.push({
                tiempo: t,
                original: this.senalOriginal(t),
                lagrange: Numericos.lagrange(x, y, t),
                newton: Numericos.newtonInterpolacion(
                    x, y, t
                ).valor,
                spline: Numericos.splineCubico(x, y, t)
            });
        }

        return curvas;
    },

    // COMPARACIÓN DE ERRORES

    compararErrores(resultados) {
        const metodos = [
            "lagrange",
            "newton",
            "spline"
        ];

        const comparacion = {};

        metodos.forEach(metodo => {
            const errores = resultados.map(
                p => p["error" +
                    metodo.charAt(0).toUpperCase() +
                    metodo.slice(1)]
            );

            const errorMaximo = Math.max(...errores);

            const errorPromedio = errores.length > 0
                ? errores.reduce((a, b) => a + b, 0) /
                  errores.length
                : 0;

            comparacion[metodo] = {
                errorMaximo,
                errorPromedio
            };
        });

        return comparacion;
    },

    // SENSIBILIDAD A PERTURBACIONES DE LAS LECTURAS

    analizarSensibilidad(datos, conjunto) {
        const separados = this.separarDatos(
            datos,
            conjunto
        );

        const x = separados.xDisponibles;
        const y = separados.yDisponibles;

        const resultados = [];

        separados.ocultos.forEach(punto => {
            const valorOriginal = Numericos.splineCubico(
                x, y, punto.tiempo
            );

            const yPerturbado = y.map(
                (valor, i) =>
                    valor + 0.01 * Math.sin((i + 1) * 1.73)
            );

            const valorPerturbado = Numericos.splineCubico(
                x, yPerturbado, punto.tiempo
            );

            resultados.push({
                tiempo: punto.tiempo,
                valorOriginal,
                valorPerturbado,
                cambioAbsoluto: Math.abs(
                    valorPerturbado - valorOriginal
                )
            });
        });

        return resultados;
    },

    // TABLA COMPLETA DE LECTURAS Y RECONSTRUCCIONES

    construirTabla(conjunto, reconstruccion) {
        const tabla = conjunto.x.map((tiempo, i) => {
            const punto = reconstruccion.resultados.find(
                p => p.indice === i
            );

            if (punto) {
                return {
                    indice: i,
                    tiempo,
                    estado: "LECTURA OCULTA",
                    valorSensor: null,
                    valorReal: punto.valorReal,
                    lagrange: punto.lagrange,
                    newton: punto.newton,
                    spline: punto.spline
                };
            }

            return {
                indice: i,
                tiempo,
                estado: "DISPONIBLE",
                valorSensor: conjunto.y[i],
                valorReal: this.senalOriginal(tiempo),
                lagrange: null,
                newton: null,
                spline: null
            };
        });

        return tabla;
    },

    // EJECUCIÓN COMPLETA DEL MÓDULO

    ejecutar(nombreEscenario = "NORMAL", cambios = {}) {
        const datos = this.obtenerEscenario(
            nombreEscenario,
            cambios
        );

        const conjunto = this.generarDatos(datos);

        const reconstruccion = this.reconstruir(
            datos,
            conjunto
        );

        const curvas = this.generarCurvas(
            datos,
            conjunto,
            reconstruccion
        );

        const errores = this.compararErrores(
            reconstruccion.resultados
        );

        const sensibilidad = this.analizarSensibilidad(
            datos,
            conjunto
        );

        const tabla = this.construirTabla(
            conjunto,
            reconstruccion
        );

        return {
            modulo: "Reconstrucción de sensores",
            escenario: nombreEscenario,
            datos,
            conjunto,
            reconstruccion,
            curvas,
            errores,
            sensibilidad,
            tabla
        };
    }
};

console.log("Módulo 4 cargado correctamente.");
