
# SIMTELE-RISK

## Sistema de simulación y análisis de riesgos mediante métodos numéricos aplicado al transporte por cable

### 1. Descripción del proyecto

SIMTELE-RISK es una aplicación web académica desarrollada como proyecto integrador de la asignatura de Métodos Numéricos. Su finalidad es aplicar diferentes métodos numéricos para representar, analizar y estudiar situaciones hipotéticas relacionadas con el funcionamiento y la seguridad de los sistemas de transporte por cable.

El sistema permite trabajar con distintos escenarios de simulación, comparar resultados, analizar errores numéricos y visualizar el comportamiento de los modelos matemáticos.

Los datos utilizados en las simulaciones son sintéticos y tienen fines exclusivamente educativos.

### 2. Objetivo general

Desarrollar un sistema web que permita aplicar métodos numéricos para modelar y analizar cuatro casos de estudio relacionados con el transporte por cable, evaluando los resultados obtenidos bajo diferentes condiciones de simulación.

### 3. Módulos del sistema

El sistema está organizado en cuatro módulos principales:

**Módulo 1. Detención de emergencia**

Representa matemáticamente el proceso de detención de una cabina mediante modelos de velocidad y posición. Utiliza métodos numéricos para aproximar la evolución del movimiento y estudiar diferentes condiciones de frenado.

**Módulo 2. Deterioro mecánico y mantenimiento**

Modela el deterioro progresivo de componentes mediante expresiones matemáticas y sistemas de ecuaciones lineales. Permite aplicar métodos iterativos y directos para obtener soluciones aproximadas.

**Módulo 3. Oscilaciones por viento**

Representa el movimiento oscilatorio de una cabina sometida a una fuerza externa. Utiliza ecuaciones diferenciales y métodos de integración numérica para estudiar su comportamiento.

**Módulo 4. Reconstrucción de sensores**

Permite reconstruir valores aproximados a partir de datos de medición utilizando técnicas de interpolación numérica.

### 4. Métodos numéricos utilizados

El proyecto contempla la aplicación de los siguientes métodos:

- Bisección.
- Newton-Raphson.
- Método de la secante.
- Método de Jacobi.
- Método de Gauss-Seidel.
- Descomposición LU.
- Gradiente conjugado.
- Método de Euler y métodos de Runge-Kutta.
- Integración numérica.
- Interpolación de Lagrange.
- Diferencias divididas de Newton.
- Splines cúbicos.

### 5. Escenarios de simulación

Cada módulo contempla tres condiciones de análisis:

- NORMAL: representa condiciones de funcionamiento de referencia.
- ESTRÉS: representa condiciones exigentes para observar el comportamiento del modelo.
- MAL CONDICIONADO: permite estudiar situaciones en las que pequeñas variaciones pueden afectar significativamente los resultados numéricos.

### 6. Análisis de errores

SIMTELE-RISK contempla el análisis de:

- Error absoluto.
- Error relativo.
- Error porcentual.
- Error residual.
- Sensibilidad de los resultados.

Estos indicadores permiten evaluar la precisión y el comportamiento de los métodos numéricos utilizados.

### 7. Tecnologías utilizadas

- HTML5: estructura de la aplicación web.
- CSS3: diseño y presentación visual.
- JavaScript: implementación de los métodos numéricos y funcionamiento de los módulos.
- Python: desarrollo del servidor.
- Flask: comunicación entre la aplicación y el servidor.
- Flask-CORS: gestión de solicitudes entre diferentes orígenes.
- SQLite: almacenamiento de simulaciones y resultados.
- Git y GitHub: control de versiones y alojamiento del código fuente.

### 8. Estructura del proyecto

```text
SIMTELE-RISK/
│
├── index.html
├── README.md
│
├── css/
│   └── styles.css
│
├── js/
│   ├── app.js
│   ├── numericos.js
│   ├── errores.js
│   ├── modulo1.js
│   ├── modulo2.js
│   ├── modulo3.js
│   ├── modulo4.js
│   └── database.js
│
├── database/
│   └── simtele_risk.sql
│
├── assets/
│
└── server.py
```

### 9. Instalación y ejecución

**Requisitos previos**

- Python 3 instalado.
- Navegador web actualizado.
- Editor de código, como Visual Studio Code.

**Paso 1. Descargar el proyecto**

Clonar el repositorio:

```bash
git clone https://github.com/USUARIO/SIMTELE-RISK.git
```

Ingresar a la carpeta:

```bash
cd SIMTELE-RISK
```

**Paso 2. Instalar dependencias**

```bash
pip install flask flask-cors
```

**Paso 3. Ejecutar el servidor**

```bash
python server.py
```

**Paso 4. Abrir la aplicación**

Abrir el archivo `index.html` en el navegador o utilizar el servidor local configurado para el proyecto.

### 10. Base de datos

El sistema contempla una base de datos SQLite para almacenar información relacionada con los casos de estudio, escenarios, simulaciones, ejecuciones de métodos, iteraciones y resultados obtenidos.

El diseño de la base de datos se encuentra representado mediante un diagrama entidad-relación.

### 11. Alcance académico

SIMTELE-RISK constituye una herramienta de aprendizaje y experimentación matemática. Los resultados permiten comparar métodos numéricos, estudiar aproximaciones y comprender la influencia de los errores en modelos aplicados a situaciones hipotéticas del transporte por cable.

El proyecto no representa un sistema certificado de control, supervisión ni seguridad operacional de Mi Teleférico.

### 12. Autores

:    - Herlan Mauricio Cerruto Salazar          C.I: 10954648
    - Alan Jesús Rodríguez Peralta              C.I: 13695176
    - Cristian Rodrigo Marca Lima                C.I: 12719709


**Institución:** Universidad Mayor De San Andres

**Gestión:** 2026

**Proyecto:** SIMTELE-RISK
