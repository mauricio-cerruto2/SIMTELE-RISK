
const Database = {

    API_URL: "http://127.0.0.1:5000/api",

    // VERIFICAR CONEXIÓN CON EL SERVIDOR

    async verificarConexion() {
        try {
            const respuesta = await fetch(
                `${this.API_URL}/estado`
            );

            if (!respuesta.ok) {
                throw new Error("El servidor respondió con un error.");
            }

            return await respuesta.json();

        } catch (error) {
            console.error("Error de conexión:", error);

            throw new Error(
                "No se pudo conectar con la base de datos. " +
                "Comprueba que el servidor Flask esté iniciado."
            );
        }
    },

    // FUNCIÓN GENERAL PARA PETICIONES HTTP

    async solicitar(endpoint, opciones = {}) {
        try {
            const respuesta = await fetch(
                `${this.API_URL}${endpoint}`,
                {
                    ...opciones,
                    headers: {
                        "Content-Type": "application/json",
                        ...(opciones.headers || {})
                    }
                }
            );

            const resultado = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(
                    resultado.error ||
                    "Error al comunicarse con la base de datos."
                );
            }

            return resultado;

        } catch (error) {
            console.error("Error Database:", error);
            throw error;
        }
    },

    // GUARDAR UNA SIMULACIÓN COMPLETA

    async guardarSimulacion(resultado) {

        if (!resultado || !resultado.modulo) {
            throw new Error(
                "No se puede guardar una simulación sin resultados."
            );
        }

        const registro = {
            modulo: resultado.modulo,
            escenario: resultado.escenario,
            fecha: new Date().toISOString(),
            parametros: resultado.datos || {},
            resultados: resultado
        };

        return await this.solicitar(
            "/simulaciones",
            {
                method: "POST",
                body: JSON.stringify(registro)
            }
        );
    },

    // OBTENER HISTORIAL DE SIMULACIONES

    async obtenerHistorial(filtros = {}) {
        const parametros = new URLSearchParams();

        if (filtros.modulo) {
            parametros.set("modulo", filtros.modulo);
        }

        if (filtros.escenario) {
            parametros.set("escenario", filtros.escenario);
        }

        if (filtros.fechaDesde) {
            parametros.set("fecha_desde", filtros.fechaDesde);
        }

        if (filtros.fechaHasta) {
            parametros.set("fecha_hasta", filtros.fechaHasta);
        }

        const consulta = parametros.toString();

        return await this.solicitar(
            `/simulaciones${consulta ? "?" + consulta : ""}`
        );
    },

    // RECUPERAR UNA SIMULACIÓN POR SU IDENTIFICADOR

    async obtenerSimulacion(id) {
        if (!id) {
            throw new Error(
                "Se necesita el identificador de la simulación."
            );
        }

        return await this.solicitar(
            `/simulaciones/${encodeURIComponent(id)}`
        );
    },

    // ELIMINAR UNA SIMULACIÓN

    async eliminarSimulacion(id) {
        if (!id) {
            throw new Error(
                "Se necesita el identificador de la simulación."
            );
        }

        return await this.solicitar(
            `/simulaciones/${encodeURIComponent(id)}`,
            {
                method: "DELETE"
            }
        );
    },

    // OBTENER ESTADÍSTICAS DEL HISTORIAL

    async obtenerEstadisticas() {
        return await this.solicitar(
            "/estadisticas"
        );
    },

    // BUSCAR SIMULACIONES

    async buscarSimulaciones(texto) {
        const consulta = encodeURIComponent(texto || "");

        return await this.solicitar(
            `/buscar?q=${consulta}`
        );
    },

    // EXPORTAR LOS DATOS DE UNA SIMULACIÓN EN JSON

    async exportarSimulacion(id) {
        const resultado = await this.obtenerSimulacion(id);

        const contenido = JSON.stringify(
            resultado,
            null,
            2
        );

        const archivo = new Blob(
            [contenido],
            { type: "application/json" }
        );

        const url = URL.createObjectURL(archivo);

        const enlace = document.createElement("a");

        enlace.href = url;
        enlace.download = `simtele-risk-${id}.json`;

        document.body.appendChild(enlace);
        enlace.click();

        enlace.remove();
        URL.revokeObjectURL(url);

        return true;
    }
};

console.log("Database.js cargado correctamente.");
