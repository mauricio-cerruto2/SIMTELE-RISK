
import sqlite3
import json
import os
import re
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS

# ==========================================
# CONFIGURACIÓN
# ==========================================

app = Flask(__name__)
CORS(app)

CARPETA = os.path.dirname(os.path.abspath(__file__))
CARPETA_DB = os.path.join(CARPETA, "database")
ARCHIVO_DB = os.path.join(CARPETA_DB, "simtele_risk.db")
ARCHIVO_SQL = os.path.join(CARPETA_DB, "simtele_risk.sql")

os.makedirs(CARPETA_DB, exist_ok=True)


# ==========================================
# CONEXIÓN SQLITE
# ==========================================

def conectar():
    conexion = sqlite3.connect(ARCHIVO_DB)
    conexion.row_factory = sqlite3.Row
    conexion.execute("PRAGMA foreign_keys = ON")
    return conexion


def inicializar_db():
    if not os.path.exists(ARCHIVO_SQL):
        raise FileNotFoundError(
            "No se encontró database/simtele_risk.sql"
        )

    with open(ARCHIVO_SQL, "r", encoding="utf-8") as archivo:
        script = archivo.read()

    conexion = conectar()

    try:
        conexion.executescript(script)
        conexion.commit()
    finally:
        conexion.close()

    print("Base de datos SQLite inicializada.")


# ==========================================
# UTILIDADES
# ==========================================

CASOS = {
    "detención de emergencia": "MOD1",
    "deterioro mecánico y mantenimiento": "MOD2",
    "oscilaciones por viento": "MOD3",
    "reconstrucción de sensores": "MOD4"
}


def obtener_caso(modulo):
    nombre = str(modulo).strip().lower()

    if nombre in CASOS:
        return CASOS[nombre]

    if nombre.startswith("modulo 1") or nombre == "mod1":
        return "MOD1"
    if nombre.startswith("modulo 2") or nombre == "mod2":
        return "MOD2"
    if nombre.startswith("modulo 3") or nombre == "mod3":
        return "MOD3"
    if nombre.startswith("modulo 4") or nombre == "mod4":
        return "MOD4"

    for nombre_caso, codigo in CASOS.items():
        if nombre_caso in nombre:
            return codigo

    raise ValueError("No se reconoce el módulo de la simulación.")


def convertir_json(valor):
    return json.dumps(
        valor,
        ensure_ascii=False,
        default=str
    )


def numero_seguro(valor):
    if isinstance(valor, bool):
        return None

    if isinstance(valor, (int, float)):
        return float(valor)

    return None


def buscar_campo(diccionario, campos):
    if not isinstance(diccionario, dict):
        return None

    for campo in campos:
        if campo in diccionario:
            return diccionario[campo]

    return None


# ==========================================
# REGISTRO DE MÉTODOS E ITERACIONES
# ==========================================

def guardar_ejecuciones(conexion, simulacion_id, resultados):
    """
    Registra las ejecuciones numéricas encontradas
    en el resultado completo de cada módulo.
    """

    metodos_con_tabla = []

    def recorrer(objeto, ruta="resultado", profundidad=0):
        if profundidad > 5 or not isinstance(objeto, dict):
            return

        for clave, valor in objeto.items():
            if not isinstance(valor, dict):
                continue

            if isinstance(valor.get("tabla"), list):
                metodos_con_tabla.append((clave, valor))

            recorrer(
                valor,
                ruta + "." + str(clave),
                profundidad + 1
            )

    recorrer(resultados)

    # Evita registrar dos veces el mismo objeto.
    registrados = set()

    for nombre, metodo in metodos_con_tabla:
        identidad = id(metodo)

        if identidad in registrados:
            continue

        registrados.add(identidad)

        tabla = metodo.get("tabla", [])

        solucion = buscar_campo(
            metodo,
            ["solucion", "raiz", "integral", "valor"]
        )

        residual = numero_seguro(
            metodo.get("residual")
        )

        iteraciones = metodo.get(
            "iteraciones",
            len(tabla)
        )

        if not isinstance(iteraciones, int):
            iteraciones = len(tabla)

        cursor = conexion.execute(
            """
            INSERT INTO ejecucion_metodo (
                simulacion_id,
                familia,
                metodo,
                resultado,
                residual,
                iteraciones,
                observaciones
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                simulacion_id,
                "Método numérico",
                str(nombre),
                numero_seguro(solucion),
                residual,
                iteraciones,
                convertir_json(metodo)
            )
        )

        ejecucion_id = cursor.lastrowid

        for indice, fila in enumerate(tabla):
            if isinstance(fila, dict):
                valor = buscar_campo(
                    fila,
                    [
                        "valor",
                        "x",
                        "aproximacion",
                        "desplazamiento",
                        "raiz"
                    ]
                )

                error = buscar_campo(
                    fila,
                    ["error", "errorAbsoluto"]
                )

                residuo_fila = buscar_campo(
                    fila,
                    ["residual", "residuo"]
                )

                conexion.execute(
                    """
                    INSERT INTO iteracion_resultado (
                        ejecucion_id,
                        numero_iteracion,
                        variable,
                        valor,
                        error,
                        residual,
                        datos_adicionales
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        ejecucion_id,
                        indice + 1,
                        str(nombre),
                        numero_seguro(valor),
                        numero_seguro(error),
                        numero_seguro(residuo_fila),
                        convertir_json(fila)
                    )
                )

            else:
                conexion.execute(
                    """
                    INSERT INTO iteracion_resultado (
                        ejecucion_id,
                        numero_iteracion,
                        variable,
                        datos_adicionales
                    )
                    VALUES (?, ?, ?, ?)
                    """,
                    (
                        ejecucion_id,
                        indice + 1,
                        str(nombre),
                        convertir_json(fila)
                    )
                )


# ==========================================
# REGISTRO DE INDICADORES RESUMIDOS
# ==========================================

def guardar_resumen(conexion, simulacion_id, resultados):
    def recorrer(objeto, prefijo="resultado", nivel=0):
        if nivel > 4 or not isinstance(objeto, dict):
            return

        for clave, valor in objeto.items():
            nombre = f"{prefijo}.{clave}"

            if isinstance(valor, (int, float)) and not isinstance(valor, bool):
                conexion.execute(
                    """
                    INSERT INTO resultado_resumen (
                        simulacion_id,
                        indicador,
                        valor,
                        unidad,
                        descripcion
                    )
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (
                        simulacion_id,
                        nombre,
                        float(valor),
                        None,
                        "Indicador numérico obtenido de la simulación."
                    )
                )

            elif isinstance(valor, dict):
                recorrer(valor, nombre, nivel + 1)

    recorrer(resultados)


# ==========================================
# API: ESTADO DEL SERVIDOR
# ==========================================

@app.route("/api/estado", methods=["GET"])
def estado():
    conexion = conectar()

    try:
        cantidad = conexion.execute(
            "SELECT COUNT(*) FROM simulacion"
        ).fetchone()[0]

        return jsonify({
            "estado": "conectado",
            "base_datos": "SQLite",
            "simulaciones": cantidad
        })

    finally:
        conexion.close()


# ==========================================
# API: GUARDAR SIMULACIÓN
# ==========================================

@app.route("/api/simulaciones", methods=["POST"])
def crear_simulacion():
    datos = request.get_json(silent=True)

    if not isinstance(datos, dict):
        return jsonify({
            "error": "Se necesita un objeto JSON válido."
        }), 400

    modulo = datos.get("modulo")
    escenario = datos.get("escenario")
    parametros = datos.get("parametros", {})
    resultados = datos.get("resultados", {})

    if not modulo or not escenario:
        return jsonify({
            "error": "Faltan el módulo o el escenario."
        }), 400

    if not isinstance(resultados, dict):
        return jsonify({
            "error": "Los resultados deben ser un objeto."
        }), 400

    if not isinstance(parametros, dict):
        return jsonify({
            "error": "Los parámetros deben ser un objeto."
        }), 400

    try:
        codigo = obtener_caso(modulo)

        conexion = conectar()

        try:
            caso = conexion.execute(
                """
                SELECT id
                FROM caso_estudio
                WHERE codigo = ?
                """,
                (codigo,)
            ).fetchone()

            if not caso:
                return jsonify({
                    "error": "El caso de estudio no existe."
                }), 404

            caso_id = caso["id"]

            escenario_db = conexion.execute(
                """
                SELECT id
                FROM escenario
                WHERE caso_id = ? AND nombre = ?
                """,
                (caso_id, escenario)
            ).fetchone()

            if not escenario_db:
                return jsonify({
                    "error": "El escenario no existe."
                }), 404

            escenario_id = escenario_db["id"]

            cursor = conexion.execute(
                """
                INSERT INTO simulacion (
                    caso_id,
                    escenario_id,
                    fecha,
                    estado,
                    parametros,
                    resultados
                )
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    caso_id,
                    escenario_id,
                    datos.get("fecha", datetime.now().isoformat()),
                    "COMPLETADA",
                    convertir_json(parametros),
                    convertir_json(resultados)
                )
            )

            simulacion_id = cursor.lastrowid

            guardar_ejecuciones(
                conexion,
                simulacion_id,
                resultados
            )

            guardar_resumen(
                conexion,
                simulacion_id,
                resultados
            )

            conexion.commit()

            return jsonify({
                "mensaje": "Simulación guardada correctamente.",
                "id": simulacion_id
            }), 201

        except Exception:
            conexion.rollback()
            raise

        finally:
            conexion.close()

    except ValueError as error:
        return jsonify({"error": str(error)}), 400

    except Exception as error:
        app.logger.exception("Error guardando simulación")
        return jsonify({
            "error": "No se pudo guardar la simulación."
        }), 500


# ==========================================
# API: CONSULTAR HISTORIAL
# ==========================================

@app.route("/api/simulaciones", methods=["GET"])
def listar_simulaciones():
    modulo = request.args.get("modulo")
    escenario = request.args.get("escenario")
    fecha_desde = request.args.get("fecha_desde")
    fecha_hasta = request.args.get("fecha_hasta")

    consulta = """
        SELECT
            s.id,
            s.fecha,
            s.estado,
            s.parametros,
            c.codigo AS codigo_modulo,
            c.nombre AS modulo,
            e.nombre AS escenario
        FROM simulacion s
        INNER JOIN caso_estudio c ON s.caso_id = c.id
        INNER JOIN escenario e ON s.escenario_id = e.id
        WHERE 1 = 1
    """

    valores = []

    if modulo:
        consulta += " AND c.codigo = ?"
        try:
            valores.append(obtener_caso(modulo))
        except ValueError:
            return jsonify({"error": "Módulo no válido."}), 400

    if escenario:
        consulta += " AND e.nombre = ?"
        valores.append(escenario)

    if fecha_desde:
        consulta += " AND date(s.fecha) >= date(?)"
        valores.append(fecha_desde)

    if fecha_hasta:
        consulta += " AND date(s.fecha) <= date(?)"
        valores.append(fecha_hasta)

    consulta += " ORDER BY s.id DESC"

    conexion = conectar()

    try:
        filas = conexion.execute(
            consulta,
            valores
        ).fetchall()

        historial = []

        for fila in filas:
            item = dict(fila)
            item["parametros"] = json.loads(
                item["parametros"]
            )
            historial.append(item)

        return jsonify({
            "total": len(historial),
            "simulaciones": historial
        })

    finally:
        conexion.close()


# ==========================================
# API: RECUPERAR UNA SIMULACIÓN
# ==========================================

@app.route("/api/simulaciones/<int:simulacion_id>", methods=["GET"])
def obtener_simulacion(simulacion_id):
    conexion = conectar()

    try:
        fila = conexion.execute(
            """
            SELECT
                s.*,
                c.codigo AS codigo_modulo,
                c.nombre AS modulo,
                e.nombre AS escenario
            FROM simulacion s
            INNER JOIN caso_estudio c ON s.caso_id = c.id
            INNER JOIN escenario e ON s.escenario_id = e.id
            WHERE s.id = ?
            """,
            (simulacion_id,)
        ).fetchone()

        if not fila:
            return jsonify({
                "error": "Simulación no encontrada."
            }), 404

        resultado = dict(fila)

        resultado["parametros"] = json.loads(
            resultado["parametros"]
        )

        resultado["resultados"] = json.loads(
            resultado["resultados"]
        )

        return jsonify(resultado)

    finally:
        conexion.close()


# ==========================================
# API: ELIMINAR SIMULACIÓN
# ==========================================

@app.route("/api/simulaciones/<int:simulacion_id>", methods=["DELETE"])
def eliminar_simulacion(simulacion_id):
    conexion = conectar()

    try:
        cursor = conexion.execute(
            """
            DELETE FROM simulacion
            WHERE id = ?
            """,
            (simulacion_id,)
        )

        if cursor.rowcount == 0:
            return jsonify({
                "error": "Simulación no encontrada."
            }), 404

        conexion.commit()

        return jsonify({
            "mensaje": "Simulación eliminada correctamente."
        })

    finally:
        conexion.close()


# ==========================================
# API: ESTADÍSTICAS
# ==========================================

@app.route("/api/estadisticas", methods=["GET"])
def estadisticas():
    conexion = conectar()

    try:
        total = conexion.execute(
            "SELECT COUNT(*) FROM simulacion"
        ).fetchone()[0]

        por_modulo = conexion.execute(
            """
            SELECT c.nombre, COUNT(s.id) AS cantidad
            FROM caso_estudio c
            LEFT JOIN simulacion s ON c.id = s.caso_id
            GROUP BY c.id
            ORDER BY c.id
            """
        ).fetchall()

        por_escenario = conexion.execute(
            """
            SELECT e.nombre, COUNT(s.id) AS cantidad
            FROM escenario e
            LEFT JOIN simulacion s ON e.id = s.escenario_id
            GROUP BY e.id
            ORDER BY e.id
            """
        ).fetchall()

        return jsonify({
            "total_simulaciones": total,
            "por_modulo": [dict(f) for f in por_modulo],
            "por_escenario": [dict(f) for f in por_escenario]
        })

    finally:
        conexion.close()


# ==========================================
# API: BÚSQUEDA
# ==========================================

@app.route("/api/buscar", methods=["GET"])
def buscar():
    texto = request.args.get("q", "").strip()

    if not texto:
        return jsonify({
            "total": 0,
            "simulaciones": []
        })

    patron = f"%{texto}%"

    conexion = conectar()

    try:
        filas = conexion.execute(
            """
            SELECT
                s.id,
                s.fecha,
                s.estado,
                c.nombre AS modulo,
                e.nombre AS escenario
            FROM simulacion s
            INNER JOIN caso_estudio c ON s.caso_id = c.id
            INNER JOIN escenario e ON s.escenario_id = e.id
            WHERE
                c.nombre LIKE ?
                OR e.nombre LIKE ?
                OR s.parametros LIKE ?
                OR s.resultados LIKE ?
            ORDER BY s.id DESC
            """,
            (patron, patron, patron, patron)
        ).fetchall()

        return jsonify({
            "total": len(filas),
            "simulaciones": [dict(f) for f in filas]
        })

    finally:
        conexion.close()


# ==========================================
# INICIO DEL SERVIDOR
# ==========================================

if __name__ == "__main__":
    inicializar_db()

    print("--------------------------------------")
    print(" SIMTELE-RISK - SERVIDOR ACTIVO")
    print(" http://127.0.0.1:5000")
    print("--------------------------------------")

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )
