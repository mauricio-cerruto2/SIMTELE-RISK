

// ==========================================
// SIMTELE-RISK
// SISTEMA PRINCIPAL DE NAVEGACIÓN
// ==========================================

const modules = {
    modulo1: {
        number: "MÓDULO 01",
        title: "Detención de emergencia",
        description: "Simulación matemática del frenado de cabinas mediante ecuaciones diferenciales, integración numérica y métodos de búsqueda de raíces.",
        icon: "◈",
        color: "blue"
    },
    modulo2: {
        number: "MÓDULO 02",
        title: "Deterioro mecánico y mantenimiento",
        description: "Análisis de indicadores hipotéticos de deterioro y estimación de umbrales de inspección.",
        icon: "⚙",
        color: "orange"
    },
    modulo3: {
        number: "MÓDULO 03",
        title: "Oscilaciones por viento",
        description: "Estudio del movimiento oscilatorio de una cabina bajo fuerzas externas.",
        icon: "〰",
        color: "purple"
    },
    modulo4: {
        number: "MÓDULO 04",
        title: "Reconstrucción de señales de sensores",
        description: "Reconstrucción de datos faltantes mediante interpolación y splines cúbicos.",
        icon: "⌁",
        color: "green"
    }
};

// ==========================================
// ELEMENTOS Y VARIABLES
// ==========================================

const pageTitle = document.getElementById("page-title");
const breadcrumb = document.getElementById("breadcrumb-page");
const dashboard = document.getElementById("dashboard");
const modulePage = document.getElementById("module-page");

let currentPage = "dashboard";
let currentScenario = "NORMAL";

let ultimoResultadoModulo1 = null;
let ultimoResultadoModulo2 = null;

// ==========================================
// NAVEGACIÓN
// ==========================================

function navigateTo(page) {
    currentPage = page;

    document.querySelectorAll(".page-section").forEach(section => {
        section.classList.add("hidden");
    });

    document.querySelectorAll(".nav-item").forEach(button => {
        button.classList.remove("active");
    });

    if (page === "dashboard") {
        dashboard.classList.remove("hidden");
        pageTitle.textContent = "Panel de control";
        breadcrumb.textContent = "Inicio";

    } else if (modules[page]) {
        modulePage.classList.remove("hidden");

        const data = modules[page];

        pageTitle.textContent = data.title;
        breadcrumb.textContent = data.number;

        document.getElementById("detail-number").textContent = data.number;
        document.getElementById("detail-title").textContent = data.title;
        document.getElementById("detail-description").textContent = data.description;

        const icon = document.getElementById("detail-icon");
        icon.textContent = data.icon;
        icon.className = "module-icon " + data.color;

        selectScenario("NORMAL");

    } else if (page === "historial") {
        document.getElementById("historial").classList.remove("hidden");
        pageTitle.textContent = "Historial de simulaciones";
        breadcrumb.textContent = "Sistema";

    } else if (page === "informacion") {
        document.getElementById("informacion").classList.remove("hidden");
        pageTitle.textContent = "Información";
        breadcrumb.textContent = "Sistema";
    }

    const activeButton = document.querySelector(
        `.nav-item[data-page="${page}"]`
    );

    if (activeButton) {
        activeButton.classList.add("active");
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
}

// ==========================================
// ESCENARIOS
// ==========================================

function selectScenario(scenario) {
    currentScenario = scenario;

    document.querySelectorAll(".scenario-card").forEach(card => {
        card.classList.toggle(
            "selected",
            card.dataset.scenario === scenario
        );
    });

    if (currentPage === "modulo1") {
        mostrarModulo1();
    }

    if (currentPage === "modulo2") {
        mostrarModulo2();
    }

    console.log("Escenario seleccionado:", currentScenario);
}

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

function formato(numero, decimales = 5) {
    if (!Number.isFinite(numero)) return "No disponible";

    return Number(numero).toFixed(decimales);
}

function obtenerNombreEscenario() {
    if (currentScenario === "ESTRÉS") return "ESTRES";
    if (currentScenario === "MAL CONDICIONADO") return "MAL_CONDICIONADO";
    return "NORMAL";
}

function crearGrafica(datos, propiedad, color, titulo, unidad) {
    const ancho = 700;
    const alto = 230;
    const margen = 35;

    const valores = datos.map(p => p[propiedad]);
    const maximo = Math.max(...valores);
    const minimo = Math.min(...valores);
    const rango = maximo - minimo || 1;

    const puntos = datos.map((p, i) => {
        const x = margen + (i / Math.max(datos.length - 1, 1)) *
            (ancho - 2 * margen);

        const y = alto - margen -
            ((p[propiedad] - minimo) / rango) *
            (alto - 2 * margen);

        return `${x},${y}`;
    }).join(" ");

    return `
        <div class="sim-chart">
            <h3>${titulo}</h3>
            <svg viewBox="0 0 ${ancho} ${alto}" role="img">
                <line x1="${margen}" y1="${alto - margen}"
                    x2="${ancho - margen}" y2="${alto - margen}"
                    stroke="#64748b" stroke-width="1"/>
                <line x1="${margen}" y1="15"
                    x2="${margen}" y2="${alto - margen}"
                    stroke="#64748b" stroke-width="1"/>
                <polyline points="${puntos}"
                    fill="none" stroke="${color}"
                    stroke-width="3" stroke-linejoin="round"
                    stroke-linecap="round"/>
                <text x="${margen}" y="14" fill="currentColor"
                    font-size="11">${formato(maximo, 2)} ${unidad}</text>
                <text x="${margen}" y="${alto - 8}" fill="currentColor"
                    font-size="11">0</text>
                <text x="${ancho - margen}" y="${alto - 8}"
                    fill="currentColor" font-size="11"
                    text-anchor="end">${formato(datos[datos.length - 1].tiempo, 2)} s</text>
            </svg>
        </div>
    `;
}

// ==========================================
// MÓDULO 1
// ==========================================

function mostrarModulo1() {
    if (currentPage !== "modulo1") return;

    const panel = document.querySelector(".placeholder-panel");
    if (!panel) return;

    panel.className = "simulation-panel";

    panel.innerHTML = `
        <div class="simulation-heading">
            <div>
                <span class="eyebrow">MÓDULO 01 · EXPERIMENTO NUMÉRICO</span>
                <h2>Simulación de detención de emergencia</h2>
                <p>Los parámetros utilizados son hipotéticos y tienen fines académicos.</p>
            </div>
            <span class="development-label">MÓDULO OPERATIVO</span>
        </div>

        <div class="parameter-panel">
            <h3>Parámetros de simulación</h3>

            <div class="parameter-grid">
                <label>
                    Velocidad inicial (m/s)
                    <input type="number" id="param-v0" min="0.01"
                        step="0.5" value="10">
                </label>

                <label>
                    Desaceleración (m/s²)
                    <input type="number" id="param-a" min="0.01"
                        step="0.1" value="1.5">
                </label>

                <label>
                    Tiempo de reacción (s)
                    <input type="number" id="param-tr" min="0"
                        step="0.1" value="1">
                </label>

                <label>
                    Paso de integración (s)
                    <input type="number" id="param-h" min="0.001"
                        step="0.05" value="0.2">
                </label>
            </div>

            <button class="primary-button" id="btn-ejecutar">
                Ejecutar simulación →
            </button>
        </div>

        <div id="resultado-modulo1">
            <p class="simulation-hint">Ejecute la simulación para obtener resultados.</p>
        </div>
    `;

    const escenario = Modulo1.obtenerEscenario(obtenerNombreEscenario());

    document.getElementById("param-v0").value = escenario.velocidadInicial;
    document.getElementById("param-a").value = escenario.desaceleracion;
    document.getElementById("param-tr").value = escenario.tiempoReaccion;
    document.getElementById("param-h").value = escenario.paso;

    document.getElementById("btn-ejecutar")
        .addEventListener("click", ejecutarModulo1);

    ejecutarModulo1();
}

function ejecutarModulo1() {
    const salida = document.getElementById("resultado-modulo1");

    try {
        const cambios = {
            velocidadInicial: Number(document.getElementById("param-v0").value),
            desaceleracion: Number(document.getElementById("param-a").value),
            tiempoReaccion: Number(document.getElementById("param-tr").value),
            paso: Number(document.getElementById("param-h").value)
        };

        ultimoResultadoModulo1 = Modulo1.ejecutar(
            obtenerNombreEscenario(),
            cambios
        );

        mostrarResultadosModulo1(ultimoResultadoModulo1);

        console.log("Simulación del Módulo 1:", ultimoResultadoModulo1);

    } catch (error) {
        salida.innerHTML = `
            <div class="simulation-error">
                <strong>Error en la simulación</strong>
                <p>${error.message}</p>
            </div>
        `;
    }
}

function mostrarResultadosModulo1(r) {
    const salida = document.getElementById("resultado-modulo1");

    const a = r.analitico;
    const i = r.integrales;
    const raiz = r.raices;
    const tabla = r.rk4.tabla;

    const filas = tabla.filter((p, index) =>
        index === 0 ||
        index === tabla.length - 1 ||
        index % Math.max(1, Math.floor(tabla.length / 10)) === 0
    );

    salida.innerHTML = `
        <div class="results-section">
            <div class="section-heading">
                <div>
                    <span class="eyebrow">RESULTADOS DEL EXPERIMENTO</span>
                    <h2>Resumen de la simulación</h2>
                    <p>Escenario: ${r.escenario}</p>
                </div>
            </div>

            <div class="result-cards">
                <div class="result-card">
                    <small>Tiempo de frenado</small>
                    <strong>${formato(a.tiempoFrenado)} s</strong>
                </div>
                <div class="result-card">
                    <small>Distancia de frenado</small>
                    <strong>${formato(a.distanciaFrenado)} m</strong>
                </div>
                <div class="result-card">
                    <small>Distancia de reacción</small>
                    <strong>${formato(a.distanciaReaccion)} m</strong>
                </div>
                <div class="result-card">
                    <small>Distancia total</small>
                    <strong>${formato(a.distanciaTotal)} m</strong>
                </div>
            </div>

            <div class="result-block">
                <h3>Comparación de ecuaciones diferenciales</h3>
                <p>RK2 utiliza la variante de punto medio explícito y RK4 el método clásico de cuarto orden.</p>
                <div class="result-cards">
                    <div class="result-card">
                        <small>Error final de posición RK2</small>
                        <strong>${formato(r.rk2.tabla.at(-1).errorPosicion)} m</strong>
                    </div>
                    <div class="result-card">
                        <small>Error final de posición RK4</small>
                        <strong>${formato(r.rk4.tabla.at(-1).errorPosicion)} m</strong>
                    </div>
                    <div class="result-card">
                        <small>Error final de velocidad RK2</small>
                        <strong>${formato(r.rk2.tabla.at(-1).errorVelocidad)} m/s</strong>
                    </div>
                    <div class="result-card">
                        <small>Error final de velocidad RK4</small>
                        <strong>${formato(r.rk4.tabla.at(-1).errorVelocidad)} m/s</strong>
                    </div>
                </div>
            </div>

            <div class="result-block">
                <h3>Integración numérica de la velocidad</h3>
                <p>Referencia analítica: ${formato(i.referencia)} m.</p>
                <div class="results-table-wrapper">
                    <table class="results-table">
                        <thead><tr><th>Método</th><th>Distancia (m)</th><th>Error absoluto</th></tr></thead>
                        <tbody>
                            <tr><td>Trapecio</td><td>${formato(i.trapecio)}</td><td>${formato(i.errores.trapecio)}</td></tr>
                            <tr><td>Simpson 1/3</td><td>${formato(i.simpson)}</td><td>${formato(i.errores.simpson)}</td></tr>
                            <tr><td>Romberg</td><td>${formato(i.romberg)}</td><td>${formato(i.errores.romberg)}</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="result-block">
                <h3>Búsqueda del instante de detención</h3>
                <div class="results-table-wrapper">
                    <table class="results-table">
                        <thead><tr><th>Método</th><th>Tiempo (s)</th><th>Error absoluto</th></tr></thead>
                        <tbody>
                            <tr><td>Bisección</td><td>${formato(raiz.biseccion)}</td><td>${formato(raiz.errores.biseccion)}</td></tr>
                            <tr><td>Newton-Raphson</td><td>${formato(raiz.newton)}</td><td>${formato(raiz.errores.newton)}</td></tr>
                            <tr><td>Secante</td><td>${formato(raiz.secante)}</td><td>${formato(raiz.errores.secante)}</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="result-block">
                <h3>Tabla de trayectoria RK4</h3>
                <div class="results-table-wrapper">
                    <table class="results-table">
                        <thead>
                            <tr><th>Tiempo</th><th>Posición</th><th>Velocidad</th><th>Error posición</th><th>Error velocidad</th></tr>
                        </thead>
                        <tbody>
                            ${filas.map(p => `
                                <tr>
                                    <td>${formato(p.tiempo)}</td>
                                    <td>${formato(p.posicion)}</td>
                                    <td>${formato(p.velocidad)}</td>
                                    <td>${formato(p.errorPosicion)}</td>
                                    <td>${formato(p.errorVelocidad)}</td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="result-block">
                <h3>Análisis de sensibilidad</h3>
                <p>Perturbación de velocidad inicial: ${formato(r.sensibilidad.perturbacionVelocidad)} m/s.</p>
                <div class="result-cards">
                    <div class="result-card"><small>Tiempo original</small><strong>${formato(r.sensibilidad.tiempoOriginal)} s</strong></div>
                    <div class="result-card"><small>Tiempo perturbado</small><strong>${formato(r.sensibilidad.tiempoPerturbado)} s</strong></div>
                    <div class="result-card"><small>Cambio de tiempo</small><strong>${formato(r.sensibilidad.cambioTiempo)} s</strong></div>
                </div>
            </div>

            <div class="result-block">
                <h3>Gráficas de trayectoria</h3>
                <p>La distancia de reacción se contabiliza por separado.</p>
                ${crearGrafica(tabla, "velocidad", "#38bdf8", "Velocidad durante el frenado", "m/s")}
                ${crearGrafica(tabla, "posicion", "#a78bfa", "Posición durante el frenado", "m")}
            </div>

            <div class="interpretation-panel">
                <h3>Interpretación</h3>
                <p>La cabina parte de ${formato(r.datos.velocidadInicial)} m/s y tiene una desaceleración constante de ${formato(r.datos.desaceleracion)} m/s². El tiempo de frenado es ${formato(a.tiempoFrenado)} segundos y la distancia total estimada, incluyendo reacción, es ${formato(a.distanciaTotal)} metros.</p>
            </div>
        </div>
    `;
}

// ==========================================
// MÓDULO 2
// ==========================================

function mostrarModulo2() {
    if (currentPage !== "modulo2") return;

    const panel = document.querySelector(".placeholder-panel");
    if (!panel) return;

    panel.className = "simulation-panel";

    const escenario = Modulo2.obtenerEscenario(obtenerNombreEscenario());

    panel.innerHTML = `
        <div class="simulation-heading">
            <div>
                <span class="eyebrow">MÓDULO 02 · EXPERIMENTO NUMÉRICO</span>
                <h2>Deterioro mecánico y mantenimiento</h2>
                <p>Modelo hipotético para estimar el momento en que un indicador de deterioro alcanza su umbral.</p>
            </div>
            <span class="development-label">MÓDULO OPERATIVO</span>
        </div>

        <div class="parameter-panel">
            <h3>Parámetros del modelo</h3>

            <div class="parameter-grid">
                <label>
                    Deterioro inicial (D₀)
                    <input type="number" id="m2-d0" min="0" step="0.1">
                </label>

                <label>
                    Coeficiente lineal (α)
                    <input type="number" id="m2-alfa" min="0" step="0.01">
                </label>

                <label>
                    Coeficiente cuadrático (β)
                    <input type="number" id="m2-beta" min="0" step="0.001">
                </label>

                <label>
                    Umbral de deterioro
                    <input type="number" id="m2-umbral" min="0.01" step="1">
                </label>
            </div>

            <button class="primary-button" id="btn-ejecutar-m2">
                Ejecutar simulación →
            </button>
        </div>

        <div id="resultado-modulo2">
            <p class="simulation-hint">Ejecute la simulación para obtener los resultados.</p>
        </div>
    `;

    document.getElementById("m2-d0").value = escenario.D0;
    document.getElementById("m2-alfa").value = escenario.alfa;
    document.getElementById("m2-beta").value = escenario.beta;
    document.getElementById("m2-umbral").value = escenario.umbral;

    document.getElementById("btn-ejecutar-m2")
        .addEventListener("click", ejecutarModulo2);

    ejecutarModulo2();
}

function ejecutarModulo2() {
    const salida = document.getElementById("resultado-modulo2");

    try {
        const cambios = {
            D0: Number(document.getElementById("m2-d0").value),
            alfa: Number(document.getElementById("m2-alfa").value),
            beta: Number(document.getElementById("m2-beta").value),
            umbral: Number(document.getElementById("m2-umbral").value)
        };

        ultimoResultadoModulo2 = Modulo2.ejecutar(
            obtenerNombreEscenario(),
            cambios
        );

        mostrarResultadosModulo2(ultimoResultadoModulo2);

        console.log("Simulación del Módulo 2:", ultimoResultadoModulo2);

    } catch (error) {
        salida.innerHTML = `
            <div class="simulation-error">
                <strong>Error en la simulación del Módulo 2</strong>
                <p>${error.message}</p>
            </div>
        `;
        console.error(error);
    }
}

function mostrarResultadosModulo2(r) {
    const salida = document.getElementById("resultado-modulo2");

    const a = r.analitico;
    const s = r.sistema;
    const ra = r.raices;

    const filas = [
        s.jacobi,
        s.gaussSeidel,
        s.lu,
        s.gradienteConjugado
    ];

    const tablaDeterioro = r.tablaDeterioro;

    salida.innerHTML = `
        <div class="results-section">
            <div class="section-heading">
                <div>
                    <span class="eyebrow">RESULTADOS DEL EXPERIMENTO</span>
                    <h2>Resumen del deterioro mecánico</h2>
                    <p>Escenario: ${r.escenario}</p>
                </div>
            </div>

            <div class="result-cards">
                <div class="result-card">
                    <small>Tiempo analítico al umbral</small>
                    <strong>${formato(a.tiempoUmbral)} unidades de tiempo</strong>
                </div>
                <div class="result-card">
                    <small>Deterioro inicial</small>
                    <strong>${formato(a.deterioroInicial)}</strong>
                </div>
                <div class="result-card">
                    <small>Deterioro al umbral</small>
                    <strong>${formato(a.deterioroUmbral)}</strong>
                </div>
                <div class="result-card">
                    <small>Deterioro al tiempo máximo</small>
                    <strong>${formato(a.deterioroFinal)}</strong>
                </div>
            </div>

            <div class="result-block">
                <h3>1. Modelo matemático</h3>
                <p><strong>D(t) = D₀ + αt + βt²</strong></p>
                <p>D₀ = ${formato(r.datos.D0)} | α = ${formato(r.datos.alfa)} | β = ${formato(r.datos.beta)} | Umbral = ${formato(r.datos.umbral)}</p>
                <p>El tiempo al umbral se obtiene resolviendo D(t) − Umbral = 0.</p>
            </div>

            <div class="result-block">
                <h3>2. Comparación de métodos de raíces</h3>
                <div class="results-table-wrapper">
                    <table class="results-table">
                        <thead>
                            <tr>
                                <th>Método</th>
                                <th>Tiempo calculado</th>
                                <th>Error absoluto</th>
                                <th>Iteraciones</th>
                                <th>Residuo</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Bisección</td>
                                <td>${formato(ra.biseccion)}</td>
                                <td>${formato(ra.errores.biseccion)}</td>
                                <td>${ra.resultados.biseccion.iteraciones}</td>
                                <td>${formato(ra.resultados.biseccion.residual)}</td>
                            </tr>
                            <tr>
                                <td>Newton-Raphson</td>
                                <td>${formato(ra.newton)}</td>
                                <td>${formato(ra.errores.newton)}</td>
                                <td>${ra.resultados.newton.iteraciones}</td>
                                <td>${formato(ra.resultados.newton.residual)}</td>
                            </tr>
                            <tr>
                                <td>Secante</td>
                                <td>${formato(ra.secante)}</td>
                                <td>${formato(ra.errores.secante)}</td>
                                <td>${ra.resultados.secante.iteraciones}</td>
                                <td>${formato(ra.resultados.secante.residual)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="result-block">
                <h3>3. Resolución de sistemas lineales 4 × 4</h3>
                <p>Se comparan los métodos iterativos con LU como referencia directa.</p>
                <div class="results-table-wrapper">
                    <table class="results-table">
                        <thead>
                            <tr>
                                <th>Método</th>
                                <th>Error absoluto</th>
                                <th>Residuo</th>
                                <th>Iteraciones</th>
                                <th>Convergencia</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filas.map(x => `
                                <tr>
                                    <td>${x.metodo}</td>
                                    <td>${formato(x.errorAbsoluto)}</td>
                                    <td>${formato(x.residual)}</td>
                                    <td>${x.iteraciones}</td>
                                    <td>${x.convergio ? "Sí" : "No"}</td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="result-block">
                <h3>4. Solución del sistema de referencia</h3>
                <div class="results-table-wrapper">
                    <table class="results-table">
                        <thead>
                            <tr><th>Variable</th><th>Valor</th></tr>
                        </thead>
                        <tbody>
                            ${s.referencia.map((v, i) => `
                                <tr><td>x${i + 1}</td><td>${formato(v)}</td></tr>
                            `).join("")}
                        </tbody>
                    </table>
                </div>
                <p>Residuo de la solución LU: ${formato(s.residualReferencia)}</p>
            </div>

            <div class="result-block">
                <h3>5. Sensibilidad del tiempo al umbral</h3>
                <div class="result-cards">
                    <div class="result-card">
                        <small>Perturbación aplicada</small>
                        <strong>${formato(r.sensibilidad.perturbacion)}</strong>
                    </div>
                    <div class="result-card">
                        <small>Tiempo original</small>
                        <strong>${formato(r.sensibilidad.tiempoOriginal)}</strong>
                    </div>
                    <div class="result-card">
                        <small>Tiempo perturbado</small>
                        <strong>${formato(r.sensibilidad.tiempoPerturbado)}</strong>
                    </div>
                    <div class="result-card">
                        <small>Cambio absoluto</small>
                        <strong>${formato(r.sensibilidad.cambioAbsoluto)}</strong>
                    </div>
                </div>
            </div>

            <div class="result-block">
                <h3>6. Evolución del deterioro</h3>
                ${crearGrafica(
                    tablaDeterioro,
                    "deterioro",
                    "#f59e0b",
                    "Crecimiento del indicador de deterioro",
                    "unidades"
                )}
                <div class="results-table-wrapper">
                    <table class="results-table">
                        <thead>
                            <tr>
                                <th>Tiempo</th>
                                <th>Deterioro</th>
                                <th>Umbral</th>
                                <th>Diferencia</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tablaDeterioro.map(p => `
                                <tr>
                                    <td>${formato(p.tiempo)}</td>
                                    <td>${formato(p.deterioro)}</td>
                                    <td>${formato(p.umbral)}</td>
                                    <td>${formato(p.diferencia)}</td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="interpretation-panel">
                <h3>Interpretación del escenario</h3>
                <p>
                    El modelo estima que el indicador de deterioro alcanza
                    el umbral establecido después de ${formato(a.tiempoUmbral)}
                    unidades de tiempo. Este resultado permite proponer
                    una inspección antes de alcanzar el límite definido.
                </p>
                <p>
                    La comparación de métodos de raíces y sistemas lineales
                    permite evaluar la precisión, convergencia y estabilidad
                    de los cálculos. Los parámetros son sintéticos y no
                    representan mediciones oficiales de Mi Teleférico.
                </p>
            </div>
        </div>
    `;
}

// ==========================================
// EVENTOS
// ==========================================

document.querySelectorAll("[data-page]").forEach(button => {
    button.addEventListener("click", () => {
        navigateTo(button.dataset.page);
    });
});

document.querySelectorAll("[data-open]").forEach(card => {
    card.addEventListener("click", () => {
        navigateTo(card.dataset.open);
    });
});

document.querySelectorAll("[data-scenario]").forEach(button => {
    button.addEventListener("click", () => {
        selectScenario(button.dataset.scenario);
    });
});

// ==========================================
// INICIALIZACIÓN
// ==========================================

navigateTo("dashboard");

console.log("SIMTELE-RISK iniciado correctamente.");
console.log("Módulos registrados:", Object.keys(modules).length);
console.log("Escenarios: NORMAL, ESTRES y MAL_CONDICIONADO.");
