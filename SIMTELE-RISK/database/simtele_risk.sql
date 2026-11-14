
PRAGMA foreign_keys = ON;

-- =========================================
-- BASE DE DATOS: SIMTELE-RISK
-- Sistema de simulación de métodos numéricos
-- =========================================

-- 1. CASOS DE ESTUDIO

CREATE TABLE IF NOT EXISTS caso_estudio (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    modelo_matematico TEXT,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. ESCENARIOS

CREATE TABLE IF NOT EXISTS escenario (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    caso_id INTEGER NOT NULL,
    nombre VARCHAR(50) NOT NULL,
    descripcion TEXT,
    parametros TEXT NOT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (caso_id)
        REFERENCES caso_estudio(id)
        ON DELETE CASCADE,

    UNIQUE(caso_id, nombre)
);

-- 3. SIMULACIONES

CREATE TABLE IF NOT EXISTS simulacion (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    caso_id INTEGER NOT NULL,
    escenario_id INTEGER NOT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(30) DEFAULT 'COMPLETADA',
    parametros TEXT NOT NULL,
    resultados TEXT NOT NULL,

    FOREIGN KEY (caso_id)
        REFERENCES caso_estudio(id),

    FOREIGN KEY (escenario_id)
        REFERENCES escenario(id)
);

-- 4. EJECUCIÓN DE MÉTODOS NUMÉRICOS

CREATE TABLE IF NOT EXISTS ejecucion_metodo (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    simulacion_id INTEGER NOT NULL,
    familia VARCHAR(80) NOT NULL,
    metodo VARCHAR(100) NOT NULL,
    resultado REAL,
    error_absoluto REAL,
    error_relativo REAL,
    error_porcentual REAL,
    residual REAL,
    iteraciones INTEGER,
    tiempo_ejecucion REAL,
    observaciones TEXT,

    FOREIGN KEY (simulacion_id)
        REFERENCES simulacion(id)
        ON DELETE CASCADE
);

-- 5. RESULTADOS DE ITERACIONES

CREATE TABLE IF NOT EXISTS iteracion_resultado (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ejecucion_id INTEGER NOT NULL,
    numero_iteracion INTEGER NOT NULL,
    variable VARCHAR(100),
    valor REAL,
    error REAL,
    residual REAL,
    datos_adicionales TEXT,

    FOREIGN KEY (ejecucion_id)
        REFERENCES ejecucion_metodo(id)
        ON DELETE CASCADE
);

-- 6. RESUMEN DE RESULTADOS

CREATE TABLE IF NOT EXISTS resultado_resumen (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    simulacion_id INTEGER NOT NULL,
    indicador VARCHAR(120) NOT NULL,
    valor REAL,
    unidad VARCHAR(50),
    descripcion TEXT,

    FOREIGN KEY (simulacion_id)
        REFERENCES simulacion(id)
        ON DELETE CASCADE
);

-- =========================================
-- ÍNDICES PARA MEJORAR LAS CONSULTAS
-- =========================================

CREATE INDEX IF NOT EXISTS idx_simulacion_fecha
ON simulacion(fecha);

CREATE INDEX IF NOT EXISTS idx_simulacion_caso
ON simulacion(caso_id);

CREATE INDEX IF NOT EXISTS idx_simulacion_escenario
ON simulacion(escenario_id);

CREATE INDEX IF NOT EXISTS idx_ejecucion_simulacion
ON ejecucion_metodo(simulacion_id);

CREATE INDEX IF NOT EXISTS idx_iteracion_ejecucion
ON iteracion_resultado(ejecucion_id);

CREATE INDEX IF NOT EXISTS idx_resumen_simulacion
ON resultado_resumen(simulacion_id);

-- =========================================
-- REGISTRO DE LOS CUATRO CASOS DE ESTUDIO
-- =========================================

INSERT OR IGNORE INTO caso_estudio
(codigo, nombre, descripcion, modelo_matematico)
VALUES
(
    'MOD1',
    'Detención de emergencia',
    'Simulación de la distancia y el tiempo de detención ante una emergencia.',
    'dx/dt = v ; dv/dt = -a'
),
(
    'MOD2',
    'Deterioro mecánico y mantenimiento',
    'Estimación del deterioro mecánico de componentes y análisis de umbrales.',
    'D(t) = D0 + alfa*t + beta*t^2'
),
(
    'MOD3',
    'Oscilaciones por viento',
    'Simulación de oscilaciones laterales provocadas por fuerzas externas.',
    'm*x'''' + c*x'' + k*x = F0*sin(w*t)'
),
(
    'MOD4',
    'Reconstrucción de sensores',
    'Reconstrucción de lecturas faltantes mediante interpolación numérica.',
    'y = f(x)'
);

-- =========================================
-- REGISTRO DE ESCENARIOS
-- =========================================

INSERT OR IGNORE INTO escenario
(caso_id, nombre, descripcion, parametros)
SELECT id, 'NORMAL',
       'Condiciones normales de funcionamiento.',
       '{}'
FROM caso_estudio;

INSERT OR IGNORE INTO escenario
(caso_id, nombre, descripcion, parametros)
SELECT id, 'ESTRES',
       'Condiciones de exigencia elevada.',
       '{}'
FROM caso_estudio;

INSERT OR IGNORE INTO escenario
(caso_id, nombre, descripcion, parametros)
SELECT id, 'MAL_CONDICIONADO',
       'Condiciones de sensibilidad numérica elevada.',
       '{}'
FROM caso_estudio;

-- =========================================
-- FIN DEL SCRIPT
-- =========================================
