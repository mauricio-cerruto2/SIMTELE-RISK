
/* =====================================================
SIMTELE-RISK
MOTOR CENTRAL DE METODOS NUMERICOS
   ===================================================== */

const Numericos = {

    // ================================================
    // 1. SISTEMAS LINEALES
    // ================================================

    validarSistema(A, b) {
        if (!Array.isArray(A) || !Array.isArray(b) ||
            A.length === 0 || A.length !== b.length) {
            throw new Error("Dimensiones incorrectas del sistema.");
        }

        const n = A.length;

        if (A.some(row => !Array.isArray(row) || row.length !== n)) {
            throw new Error("La matriz debe ser cuadrada.");
        }

        if (A.flat().concat(b).some(x => !Number.isFinite(x))) {
            throw new Error("La matriz y el vector deben contener números finitos.");
        }
    },

    normaVector(v) {
        return Math.sqrt(v.reduce((sum, x) => sum + x * x, 0));
    },

    residual(A, x, b) {
        return b.map((bi, i) =>
            bi - A[i].reduce((sum, aij, j) => sum + aij * x[j], 0)
        );
    },

    jacobi(A, b, tol = 1e-8, maxIter = 1000, x0 = null) {
        this.validarSistema(A, b);

        const n = b.length;
        let x = x0 ? [...x0] : Array(n).fill(0);
        const tabla = [];

        for (let k = 1; k <= maxIter; k++) {
            const nuevo = Array(n).fill(0);

            for (let i = 0; i < n; i++) {
                if (Math.abs(A[i][i]) < 1e-14)
                    throw new Error("Pivote diagonal nulo.");

                let suma = 0;

                for (let j = 0; j < n; j++) {
                    if (j !== i) suma += A[i][j] * x[j];
                }

                nuevo[i] = (b[i] - suma) / A[i][i];
            }

            const error = this.normaVector(
                nuevo.map((v, i) => v - x[i])
            );

            const residuo = this.normaVector(this.residual(A, nuevo, b));

            tabla.push({
                iteracion: k,
                aproximacion: [...nuevo],
                error,
                residual: residuo
            });

            x = nuevo;

            if (error <= tol) {
                return { solucion: x, iteraciones: k, convergio: true, tabla, residual: residuo };
            }
        }

        return {
            solucion: x,
            iteraciones: maxIter,
            convergio: false,
            tabla,
            residual: this.normaVector(this.residual(A, x, b))
        };
    },

    gaussSeidel(A, b, tol = 1e-8, maxIter = 1000, x0 = null) {
        this.validarSistema(A, b);

        const n = b.length;
        let x = x0 ? [...x0] : Array(n).fill(0);
        const tabla = [];

        for (let k = 1; k <= maxIter; k++) {
            const anterior = [...x];

            for (let i = 0; i < n; i++) {
                if (Math.abs(A[i][i]) < 1e-14)
                    throw new Error("Pivote diagonal nulo.");

                let suma = 0;

                for (let j = 0; j < n; j++) {
                    if (j !== i) suma += A[i][j] * x[j];
                }

                x[i] = (b[i] - suma) / A[i][i];
            }

            const error = this.normaVector(
                x.map((v, i) => v - anterior[i])
            );

            const residuo = this.normaVector(this.residual(A, x, b));

            tabla.push({
                iteracion: k,
                aproximacion: [...x],
                error,
                residual: residuo
            });

            if (error <= tol) {
                return { solucion: x, iteraciones: k, convergio: true, tabla, residual: residuo };
            }
        }

        return {
            solucion: x,
            iteraciones: maxIter,
            convergio: false,
            tabla,
            residual: this.normaVector(this.residual(A, x, b))
        };
    },

    lu(A, b) {
        this.validarSistema(A, b);

        const n = b.length;
        const U = A.map(row => [...row]);
        const L = Array.from({ length: n }, (_, i) =>
            Array.from({ length: n }, (_, j) => i === j ? 1 : 0)
        );
        const P = Array.from({ length: n }, (_, i) =>
            Array.from({ length: n }, (_, j) => i === j ? 1 : 0)
        );

        for (let k = 0; k < n; k++) {
            let pivot = k;

            for (let i = k + 1; i < n; i++) {
                if (Math.abs(U[i][k]) > Math.abs(U[pivot][k])) {
                    pivot = i;
                }
            }

            if (Math.abs(U[pivot][k]) < 1e-14) {
                throw new Error("La matriz es singular.");
            }

            if (pivot !== k) {
                [U[k], U[pivot]] = [U[pivot], U[k]];
                [P[k], P[pivot]] = [P[pivot], P[k]];

                for (let j = 0; j < k; j++) {
                    [L[k][j], L[pivot][j]] = [L[pivot][j], L[k][j]];
                }
            }

            for (let i = k + 1; i < n; i++) {
                const factor = U[i][k] / U[k][k];
                L[i][k] = factor;

                for (let j = k; j < n; j++) {
                    U[i][j] -= factor * U[k][j];
                }
            }
        }

        const pb = P.map(row =>
            row.reduce((sum, value, j) => sum + value * b[j], 0)
        );

        const y = Array(n).fill(0);

        for (let i = 0; i < n; i++) {
            let suma = 0;

            for (let j = 0; j < i; j++) suma += L[i][j] * y[j];

            y[i] = pb[i] - suma;
        }

        const x = Array(n).fill(0);

        for (let i = n - 1; i >= 0; i--) {
            let suma = 0;

            for (let j = i + 1; j < n; j++) suma += U[i][j] * x[j];

            x[i] = (y[i] - suma) / U[i][i];
        }

        return {
            solucion: x,
            L,
            U,
            P,
            residual: this.normaVector(this.residual(A, x, b))
        };
    },

    gradienteConjugado(A, b, tol = 1e-8, maxIter = 1000, x0 = null) {
        this.validarSistema(A, b);

        const n = b.length;

        // Comprobar simetría
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                if (Math.abs(A[i][j] - A[j][i]) > 1e-10) {
                    throw new Error("Gradiente conjugado requiere matriz simétrica.");
                }
            }
        }

        let x = x0 ? [...x0] : Array(n).fill(0);

        const producto = (M, v) =>
            M.map(row => row.reduce((s, a, j) => s + a * v[j], 0));

        const punto = (u, v) =>
            u.reduce((s, val, i) => s + val * v[i], 0);

        let r = b.map((v, i) => v - producto(A, x)[i]);
        let p = [...r];
        let rr = punto(r, r);

        const tabla = [];

        if (Math.sqrt(rr) <= tol) {
            return { solucion: x, iteraciones: 0, convergio: true, tabla, residual: Math.sqrt(rr) };
        }

        for (let k = 1; k <= maxIter; k++) {
            const Ap = producto(A, p);
            const denominador = punto(p, Ap);

            if (denominador <= 0) {
                throw new Error("La matriz no cumple la positividad requerida por el método.");
            }

            const alpha = rr / denominador;

            x = x.map((v, i) => v + alpha * p[i]);
            const rNuevo = r.map((v, i) => v - alpha * Ap[i]);

            const rrNuevo = punto(rNuevo, rNuevo);
            const error = Math.sqrt(rrNuevo);

            tabla.push({
                iteracion: k,
                aproximacion: [...x],
                error,
                residual: error
            });

            if (error <= tol) {
                return { solucion: x, iteraciones: k, convergio: true, tabla, residual: error };
            }

            const beta = rrNuevo / rr;
            p = rNuevo.map((v, i) => v + beta * p[i]);

            r = rNuevo;
            rr = rrNuevo;
        }

        return {
            solucion: x,
            iteraciones: maxIter,
            convergio: false,
            tabla,
            residual: Math.sqrt(rr)
        };
    },

    // ================================================
    // 2. METODOS PARA ENCONTRAR RAICES
    // ================================================

    biseccion(f, a, b, tol = 1e-8, maxIter = 1000) {
        let fa = f(a);
        let fb = f(b);

        if (fa * fb > 0) {
            throw new Error("El intervalo no presenta cambio de signo.");
        }

        const tabla = [];

        for (let k = 1; k <= maxIter; k++) {
            const c = (a + b) / 2;
            const fc = f(c);

            const error = Math.abs(b - a) / 2;

            tabla.push({
                iteracion: k,
                a, b, aproximacion: c,
                funcion: fc,
                error
            });

            if (Math.abs(fc) <= tol || error <= tol) {
                return { raiz: c, iteraciones: k, convergio: true, tabla, residual: Math.abs(fc) };
            }

            if (fa * fc < 0) {
                b = c;
                fb = fc;
            } else {
                a = c;
                fa = fc;
            }
        }

        return { raiz: (a + b) / 2, iteraciones: maxIter, convergio: false, tabla };
    },

    newton(f, df, x0, tol = 1e-8, maxIter = 1000) {
        let x = x0;
        const tabla = [];

        for (let k = 1; k <= maxIter; k++) {
            const fx = f(x);
            const dfx = df(x);

            if (Math.abs(dfx) < 1e-14) {
                throw new Error("Derivada demasiado pequeña.");
            }

            const nuevo = x - fx / dfx;
            const error = Math.abs(nuevo - x);

            tabla.push({
                iteracion: k,
                aproximacion: nuevo,
                funcion: f(nuevo),
                error
            });

            x = nuevo;

            if (error <= tol || Math.abs(f(x)) <= tol) {
                return { raiz: x, iteraciones: k, convergio: true, tabla, residual: Math.abs(f(x)) };
            }
        }

        return { raiz: x, iteraciones: maxIter, convergio: false, tabla };
    },

    secante(f, x0, x1, tol = 1e-8, maxIter = 1000) {
        const tabla = [];

        for (let k = 1; k <= maxIter; k++) {
            const f0 = f(x0);
            const f1 = f(x1);
            const denominador = f1 - f0;

            if (Math.abs(denominador) < 1e-14) {
                throw new Error("Denominador demasiado pequeño.");
            }

            const nuevo = x1 - f1 * (x1 - x0) / denominador;
            const error = Math.abs(nuevo - x1);

            tabla.push({
                iteracion: k,
                aproximacion: nuevo,
                funcion: f(nuevo),
                error
            });

            x0 = x1;
            x1 = nuevo;

            if (error <= tol || Math.abs(f(x1)) <= tol) {
                return { raiz: x1, iteraciones: k, convergio: true, tabla, residual: Math.abs(f(x1)) };
            }
        }

        return { raiz: x1, iteraciones: maxIter, convergio: false, tabla };
    },

    // ================================================
    // 3. METODOS DE INTEGRACION NUMERICA
    // ================================================

    trapecio(f, a, b, n) {
        if (!Number.isInteger(n) || n < 1) {
            throw new Error("El número de subintervalos debe ser positivo.");
        }

        const h = (b - a) / n;
        let suma = (f(a) + f(b)) / 2;

        for (let i = 1; i < n; i++) {
            suma += f(a + i * h);
        }

        return {
            integral: suma * h,
            paso: h,
            subintervalos: n
        };
    },

    simpson(f, a, b, n) {
        if (!Number.isInteger(n) || n < 2 || n % 2 !== 0) {
            throw new Error("Simpson 1/3 requiere un número par de subintervalos.");
        }

        const h = (b - a) / n;
        let suma = f(a) + f(b);

        for (let i = 1; i < n; i++) {
            suma += (i % 2 === 0 ? 2 : 4) * f(a + i * h);
        }

        return {
            integral: (h / 3) * suma,
            paso: h,
            subintervalos: n
        };
    },

    romberg(f, a, b, niveles = 5) {
        if (!Number.isInteger(niveles) || niveles < 1 || niveles > 12) {
            throw new Error("Los niveles de Romberg deben estar entre 1 y 12.");
        }

        const R = Array.from({ length: niveles }, () =>
            Array(niveles).fill(null)
        );

        const tabla = [];

        for (let i = 0; i < niveles; i++) {
            const n = Math.pow(2, i);
            R[i][0] = this.trapecio(f, a, b, n).integral;

            for (let j = 1; j <= i; j++) {
                const factor = Math.pow(4, j);
                R[i][j] = R[i][j - 1] +
                    (R[i][j - 1] - R[i - 1][j - 1]) / (factor - 1);
            }

            tabla.push({
                nivel: i + 1,
                subintervalos: n,
                aproximacion: R[i][i],
                paso: (b - a) / n
            });
        }

        return {
            integral: R[niveles - 1][niveles - 1],
            tabla,
            matriz: R
        };
    },

    // ================================================
    // 4. ECUACIONES DIFERENCIALES
    // RK2: PUNTO MEDIO EXPLICITO
    // ================================================

    rk2(f, t0, y0, h, pasos) {
        return this.rungeKutta(f, t0, y0, h, pasos, 2);
    },

    rk4(f, t0, y0, h, pasos) {
        return this.rungeKutta(f, t0, y0, h, pasos, 4);
    },

    rungeKutta(f, t0, y0, h, pasos, orden) {
        if (!(h > 0) || !Number.isInteger(pasos) || pasos < 1) {
            throw new Error("Paso y número de iteraciones inválidos.");
        }

        const esSistema = Array.isArray(y0);
        const copiar = y => esSistema ? [...y] : y;
        const sumar = (y, k, factor) => esSistema
            ? y.map((v, i) => v + factor * k[i])
            : y + factor * k;

        const tabla = [];
        let t = t0;
        let y = copiar(y0);

        tabla.push({ tiempo: t, valor: copiar(y) });

        for (let i = 1; i <= pasos; i++) {
            const k1 = f(t, copiar(y));

            if (orden === 2) {
                const k2 = f(
                    t + h / 2,
                    sumar(y, k1, h / 2)
                );

                y = sumar(y, k2, h);
            } else {
                const k2 = f(
                    t + h / 2,
                    sumar(y, k1, h / 2)
                );

                const k3 = f(
                    t + h / 2,
                    sumar(y, k2, h / 2)
                );

                const k4 = f(
                    t + h,
                    sumar(y, k3, h)
                );

                if (esSistema) {
                    y = y.map((v, j) =>
                        v + h * (
                            k1[j] + 2 * k2[j] +
                            2 * k3[j] + k4[j]
                        ) / 6
                    );
                } else {
                    y = y + h * (k1 + 2 * k2 + 2 * k3 + k4) / 6;
                }
            }

            t = t0 + i * h;

            tabla.push({
                tiempo: t,
                valor: copiar(y)
            });
        }

        return {
            solucion: y,
            tabla,
            paso: h,
            iteraciones: pasos,
            orden
        };
    },

    // ================================================
    // 5. INTERPOLACION
    // ================================================

    validarNodos(x, y) {
        if (!Array.isArray(x) || !Array.isArray(y) ||
            x.length !== y.length || x.length < 2) {
            throw new Error("Se requieren al menos dos pares de nodos.");
        }

        if (x.some(v => !Number.isFinite(v)) ||
            y.some(v => !Number.isFinite(v))) {
            throw new Error("Los nodos deben ser numéricos.");
        }

        if (new Set(x).size !== x.length) {
            throw new Error("Los nodos x deben ser distintos.");
        }
    },

    lagrange(x, y, xp) {
        this.validarNodos(x, y);

        let resultado = 0;

        for (let i = 0; i < x.length; i++) {
            let termino = y[i];

            for (let j = 0; j < x.length; j++) {
                if (i !== j) {
                    termino *= (xp - x[j]) / (x[i] - x[j]);
                }
            }

            resultado += termino;
        }

        return resultado;
    },

    newtonInterpolacion(x, y, xp) {
        this.validarNodos(x, y);

        const n = x.length;
        const diferencias = [...y];

        for (let j = 1; j < n; j++) {
            for (let i = n - 1; i >= j; i--) {
                diferencias[i] =
                    (diferencias[i] - diferencias[i - 1]) /
                    (x[i] - x[i - j]);
            }
        }

        let resultado = diferencias[n - 1];

        for (let i = n - 2; i >= 0; i--) {
            resultado = resultado * (xp - x[i]) + diferencias[i];
        }

        return {
            valor: resultado,
            coeficientes: diferencias
        };
    },

    splineCubico(x, y, xp) {
        this.validarNodos(x, y);

        const n = x.length;

        if (xp < x[0] || xp > x[n - 1]) {
            throw new Error("El punto debe estar dentro del intervalo de los nodos.");
        }

        const h = Array(n - 1).fill(0);

        for (let i = 0; i < n - 1; i++) {
            h[i] = x[i + 1] - x[i];

            if (h[i] <= 0) {
                throw new Error("Los nodos x deben estar ordenados de menor a mayor.");
            }
        }

        const alpha = Array(n).fill(0);

        for (let i = 1; i < n - 1; i++) {
            alpha[i] =
                3 * (y[i + 1] - y[i]) / h[i] -
                3 * (y[i] - y[i - 1]) / h[i - 1];
        }

        const l = Array(n).fill(1);
        const mu = Array(n).fill(0);
        const z = Array(n).fill(0);
        const c = Array(n).fill(0);
        const b = Array(n - 1).fill(0);
        const d = Array(n - 1).fill(0);

        for (let i = 1; i < n - 1; i++) {
            l[i] = 2 * (x[i + 1] - x[i - 1]) -
                h[i - 1] * mu[i - 1];

            if (Math.abs(l[i]) < 1e-14) {
                throw new Error("Sistema singular al construir el spline.");
            }

            mu[i] = h[i] / l[i];

            z[i] = (alpha[i] - h[i - 1] * z[i - 1]) / l[i];
        }

        for (let j = n - 2; j >= 0; j--) {
            c[j] = z[j] - mu[j] * c[j + 1];

            b[j] = (y[j + 1] - y[j]) / h[j] -
                h[j] * (c[j + 1] + 2 * c[j]) / 3;

            d[j] = (c[j + 1] - c[j]) / (3 * h[j]);
        }

        let i = n - 2;

        for (let j = 0; j < n - 1; j++) {
            if (xp >= x[j] && xp <= x[j + 1]) {
                i = j;
                break;
            }
        }

        const dx = xp - x[i];

        return y[i] + b[i] * dx +
            c[i] * dx ** 2 + d[i] * dx ** 3;
    }

};

console.log("Motor de métodos numéricos cargado.");
