
const Modulo3 = {

    // Parámetros sintéticos para fines académicos.
    // x: desplazamiento (m)
    // v: velocidad lateral (m/s)
    // m: masa equivalente (kg)
    // c: amortiguamiento (N·s/m)
    // k: rigidez (N/m)
    // F: fuerza externa del viento (N)

    escenarios: {
        NORMAL: {
            masa: 500,
            amortiguamiento: 120,
            rigidez: 800,
            fuerzaViento: 100,
            frecuenciaViento: 1.2,
            desplazamientoInicial: 0.05,
            velocidadInicial: 0,
            paso: 0.05,
            duracion: 10
        },

        ESTRES: {
            masa: 500,
            amortiguamiento: 45,
            rigidez: 650,
            fuerzaViento: 300,
            frecuenciaViento: 1.5,
            desplazamientoInicial: 0.10,
            velocidadInicial: 0.2,
            paso: 0.1,
            duracion: 15
        },

        MAL_CONDICIONADO: {
            masa: 500,
            amortiguamiento: 5,
            rigidez: 800,
            fuerzaViento: 450,
            frecuenciaViento: 1.25,
            desplazamientoInicial: 0.15,
            velocidadInicial: 0.1,
            paso: 0.2,
            duracion: 20
        }
    },

    validar(datos) {
        const valores = [
            datos.masa,
            datos.amortiguamiento,
            datos.rigidez,
            datos.fuerzaViento,
            datos.frecuenciaViento,
            datos.desplazamientoInicial,
            datos.velocidadInicial,
            datos.paso,
            datos.duracion
        ];

        if (!valores.every(Number.isFinite)) {
            throw new Error("Todos los parámetros deben ser numéricos.");
        }

        if (
            datos.masa <= 0 ||
            datos.amortiguamiento < 0 ||
            datos.rigidez <= 0 ||
            datos.frecuenciaViento < 0 ||
            datos.paso <= 0 ||
            datos.duracion <= 0
        ) {
            throw new Error("Verifica los parámetros físicos ingresados.");
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

    // MODELO MATEMÁTICO:
    // m*x'' + c*x' + k*x = F0*sin(w*t)
    //
    // Sistema equivalente:
    // x' = v
    // v' = (F(t) - c*v - k*x)/m

    fuerza(datos, t) {
        return datos.fuerzaViento *
            Math.sin(datos.frecuenciaViento * t);
    },

    construirSistema(datos) {
        return (t, estado) => {
            const x = estado[0];
            const v = estado[1];

            const F = this.fuerza(datos, t);

            return [
                v,
                (F -
                    datos.amortiguamiento * v -
                    datos.rigidez * x) / datos.masa
            ];
        };
    },

    // SOLUCIÓN NUMÉRICA MEDIANTE RK2 Y RK4

    calcularTrayectoria(datos, metodo = "RK4") {
        const pasos = Math.ceil(datos.duracion / datos.paso);
        const h = datos.duracion / pasos;

        const sistema = this.construirSistema(datos);

        const estadoInicial = [
            datos.desplazamientoInicial,
            datos.velocidadInicial
        ];

        const resultado = metodo === "RK2"
            ? Numericos.rk2(
                sistema, 0, estadoInicial, h, pasos
            )
            : Numericos.rk4(
                sistema, 0, estadoInicial, h, pasos
            );

        const tabla = resultado.tabla.map(p => ({
            tiempo: p.tiempo,
            desplazamiento: p.valor[0],
            velocidad: p.valor[1],
            fuerza: this.fuerza(datos, p.tiempo)
        }));

        return {
            metodo,
            paso: h,
            iteraciones: pasos,
            tabla,
            solucion: resultado.solucion
        };
    },

    // INTEGRACIÓN DE LA MAGNITUD CUADRÁTICA
    // Se integra x(t)^2 para medir la exposición
    // acumulada al desplazamiento lateral.

    calcularIntegrales(datos, trayectoria) {
        const tabla = trayectoria.tabla;

        const n = tabla.length - 1;

        const valores = tabla.map(p => p.desplazamiento ** 2);

        const funcion = t => {
            const indice = Math.min(
                Math.round(t / trayectoria.paso),
                valores.length - 1
            );

            return valores[indice];
        };

        const trapecio = Numericos.trapecio(
            funcion, 0, datos.duracion, n
        );

        const nSimpson = n % 2 === 0 ? n : n - 1;

        const simpson = Numericos.simpson(
            funcion, 0, datos.duracion, nSimpson
        );

        const romberg = Numericos.romberg(
            funcion, 0, datos.duracion, 6
        );

        return {
            trapecio: trapecio.integral,
            simpson: simpson.integral,
            romberg: romberg.integral,
            subintervalos: n,
            subintervalosSimpson: nSimpson
        };
    },

    // COMPARACIÓN ENTRE RK2 Y RK4

    compararMetodos(rk2, rk4) {
        const tabla = [];

        for (let i = 0; i < rk2.tabla.length; i++) {
            const p2 = rk2.tabla[i];
            const p4 = rk4.tabla[i];

            tabla.push({
                tiempo: p2.tiempo,
                desplazamientoRK2: p2.desplazamiento,
                desplazamientoRK4: p4.desplazamiento,
                errorDesplazamiento: Math.abs(
                    p2.desplazamiento - p4.desplazamiento
                ),
                velocidadRK2: p2.velocidad,
                velocidadRK4: p4.velocidad,
                errorVelocidad: Math.abs(
                    p2.velocidad - p4.velocidad
                )
            });
        }

        return tabla;
    },

    // ANÁLISIS DE AMPLITUD

    analizarAmplitud(trayectoria) {
        const valores = trayectoria.tabla.map(
            p => Math.abs(p.desplazamiento)
        );

        const maximo = Math.max(...valores);
        const minimo = Math.min(...valores);

        const indice = valores.indexOf(maximo);

        return {
            amplitudMaxima: maximo,
            amplitudMinima: minimo,
            tiempoAmplitudMaxima:
                trayectoria.tabla[indice].tiempo,
            desplazamientoFinal:
                trayectoria.tabla[trayectoria.tabla.length - 1].desplazamiento,
            velocidadFinal:
                trayectoria.tabla[trayectoria.tabla.length - 1].velocidad
        };
    },

    // ANÁLISIS DE SENSIBILIDAD
    // Se perturba la fuerza externa del viento en 1%.

    analizarSensibilidad(datos, trayectoriaOriginal) {
        const perturbacion = Math.abs(datos.fuerzaViento) * 0.01;

        const datosPerturbados = {
            ...datos,
            fuerzaViento: datos.fuerzaViento + perturbacion
        };

        const trayectoriaPerturbada = this.calcularTrayectoria(
            datosPerturbados,
            "RK4"
        );

        const original = this.analizarAmplitud(
            trayectoriaOriginal
        );

        const perturbado = this.analizarAmplitud(
            trayectoriaPerturbada
        );

        const cambioAbsoluto = Math.abs(
            perturbado.amplitudMaxima -
            original.amplitudMaxima
        );

        const sensibilidadRelativa =
            original.amplitudMaxima > 1e-14
                ? (cambioAbsoluto / original.amplitudMaxima) /
                  (perturbacion / Math.max(Math.abs(datos.fuerzaViento), 1e-14))
                : null;

        return {
            perturbacion,
            fuerzaOriginal: datos.fuerzaViento,
            fuerzaPerturbada: datosPerturbados.fuerzaViento,
            amplitudOriginal: original.amplitudMaxima,
            amplitudPerturbada: perturbado.amplitudMaxima,
            cambioAbsoluto,
            sensibilidadRelativa
        };
    },

    // TEORÍA DE ERRORES

    calcularTeoriaErrores(rk2, rk4, comparacion, integrales) {
        const maxErrorDesplazamiento = Math.max(
            ...comparacion.map(p => p.errorDesplazamiento)
        );

        const maxErrorVelocidad = Math.max(
            ...comparacion.map(p => p.errorVelocidad)
        );

        const diferenciaIntegracion = {
            trapecioSimpson: Math.abs(
                integrales.trapecio - integrales.simpson
            ),
            trapecioRomberg: Math.abs(
                integrales.trapecio - integrales.romberg
            ),
            simpsonRomberg: Math.abs(
                integrales.simpson - integrales.romberg
            )
        };

        const final2 = rk2.tabla[rk2.tabla.length - 1];
        const final4 = rk4.tabla[rk4.tabla.length - 1];

        return {
            errorMaximoDesplazamiento: maxErrorDesplazamiento,
            errorMaximoVelocidad: maxErrorVelocidad,
            errorFinalDesplazamiento: Math.abs(
                final2.desplazamiento - final4.desplazamiento
            ),
            errorFinalVelocidad: Math.abs(
                final2.velocidad - final4.velocidad
            ),
            diferenciasIntegracion: diferenciaIntegracion
        };
    },

    // EJECUCIÓN COMPLETA DEL MÓDULO

    ejecutar(nombreEscenario = "NORMAL", cambios = {}) {
        const datos = this.obtenerEscenario(
            nombreEscenario,
            cambios
        );

        const rk2 = this.calcularTrayectoria(datos, "RK2");
        const rk4 = this.calcularTrayectoria(datos, "RK4");

        const comparacion = this.compararMetodos(rk2, rk4);

        const amplitudRK2 = this.analizarAmplitud(rk2);
        const amplitudRK4 = this.analizarAmplitud(rk4);

        const integrales = this.calcularIntegrales(datos, rk4);

        const sensibilidad = this.analizarSensibilidad(
            datos, rk4
        );

        const teoriaErrores = this.calcularTeoriaErrores(
            rk2, rk4, comparacion, integrales
        );

        return {
            modulo: "Oscilaciones por viento",
            escenario: nombreEscenario,
            datos,
            modelo: "m*x'' + c*x' + k*x = F0*sin(w*t)",
            rk2,
            rk4,
            comparacion,
            amplitudRK2,
            amplitudRK4,
            integrales,
            sensibilidad,
            teoriaErrores
        };
    }
};

console.log("Módulo 3 cargado correctamente.");
