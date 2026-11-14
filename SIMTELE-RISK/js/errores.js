
/* =====================================================
   SIMTELE-RISK
   SISTEMA TRANSVERSAL DE TEORIA DE ERRORES
   ===================================================== */

   const Errores = {

    // Error absoluto
    absoluto(exacto, aproximado) {
        return Math.abs(exacto - aproximado);
    },

    // Error relativo
    relativo(exacto, aproximado) {
        const ea = this.absoluto(exacto, aproximado);

        if (Math.abs(exacto) < 1e-14) {
            return null;
        }

        return ea / Math.abs(exacto);
    },

    // Error porcentual
    porcentual(exacto, aproximado) {
        const er = this.relativo(exacto, aproximado);

        return er === null ? null : er * 100;
    },

    // Error entre dos aproximaciones consecutivas
    aproximaciones(anterior, actual) {
        return Math.abs(actual - anterior);
    },

    // Residuo de un sistema lineal
    residualSistema(A, x, b) {
        const r = b.map((bi, i) =>
            bi - A[i].reduce((s, aij, j) => s + aij * x[j], 0)
        );

        return {
            vector: r,
            norma: Math.sqrt(r.reduce((s, v) => s + v * v, 0))
        };
    },

    // Residuo de una ecuación f(x)=0
    residualRaiz(f, x) {
        return Math.abs(f(x));
    },

    // Comparación de resultados
    comparar(exacto, aproximado) {
        return {
            exacto,
            aproximado,
            errorAbsoluto: this.absoluto(exacto, aproximado),
            errorRelativo: this.relativo(exacto, aproximado),
            errorPorcentual: this.porcentual(exacto, aproximado)
        };
    },

    // Sensibilidad frente a perturbaciones
    sensibilidad(valorOriginal, valorPerturbado,
                 entradaOriginal, entradaPerturbada) {

        const cambioSalida = Math.abs(valorPerturbado - valorOriginal);
        const cambioEntrada = Math.abs(entradaPerturbada - entradaOriginal);

        if (Math.abs(entradaOriginal) < 1e-14 ||
            Math.abs(valorOriginal) < 1e-14) {
            return null;
        }

        const variacionSalida = cambioSalida / Math.abs(valorOriginal);
        const variacionEntrada = cambioEntrada / Math.abs(entradaOriginal);

        if (variacionEntrada === 0) return null;

        return variacionSalida / variacionEntrada;
    },

    // Tabla de comparación entre métodos
    tablaComparacion(exacto, resultados) {

        return resultados.map(resultado => {

            const comparacion = this.comparar(
                exacto,
                resultado.valor
            );

            return {
                metodo: resultado.metodo,
                valor: resultado.valor,
                errorAbsoluto: comparacion.errorAbsoluto,
                errorRelativo: comparacion.errorRelativo,
                errorPorcentual: comparacion.errorPorcentual
            };
        });
    },

    // Error global de una solución vectorial
    errorVectorial(exacto, aproximado) {

        if (exacto.length !== aproximado.length) {
            throw new Error("Los vectores deben tener la misma dimensión.");
        }

        const diferencias = exacto.map((v, i) => v - aproximado[i]);

        const errorAbsoluto = Math.sqrt(
            diferencias.reduce((s, v) => s + v * v, 0)
        );

        const normaExacta = Math.sqrt(
            exacto.reduce((s, v) => s + v * v, 0)
        );

        return {
            errorAbsoluto,
            errorRelativo: normaExacta < 1e-14
                ? null
                : errorAbsoluto / normaExacta
        };
    }

};

console.log("Sistema de teoría de errores cargado.");
