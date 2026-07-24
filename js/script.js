document.addEventListener("DOMContentLoaded", () => {
    const objetoSVG = document.getElementById("dibujo-zarzamorita");
    const botonesColor = document.querySelectorAll(".color-paleta");
    const porcentajeTexto = document.getElementById("porcentaje");
    const barraProgreso = document.getElementById("relleno-progreso");
    const mensajeJuego = document.getElementById("mensaje-juego");
    const muestraColor = document.getElementById("muestra-color");
    const nombreColor = document.getElementById("nombre-color");
    const botonReiniciar = document.getElementById("reiniciar-juego");
    const botonPista = document.getElementById("boton-pista");
    const modalPremio = document.getElementById("modal-premio");
    const cerrarPremio = document.getElementById("cerrar-premio");
    const verPremio = document.getElementById("ver-premio");

    const CLAVE_GUARDADO = "dulceChispaZarzamorita";

    let colorSeleccionado = "";
    let nombreSeleccionado = "";
    let piezas = [];
    let juegoTerminado = false;
    let confetiActivo = false;

    const nombresColores = {
        "#51204f": "Mora oscura",
        "#76266f": "Zarzamora",
        "#82347d": "Mora clara",
        "#fff8e8": "Crema",
        "#f5dfb8": "Cheesecake",
        "#c98b45": "Galleta",
        "#56844d": "Hoja verde",
        "#d9d9e8": "Plato"
    };

    botonesColor.forEach((boton, indice) => {
        boton.setAttribute(
            "aria-label",
            `${indice + 1}. ${nombresColores[boton.dataset.color]}`
        );

        boton.addEventListener("click", () => {
            seleccionarColor(boton);
        });
    });

    objetoSVG.addEventListener("load", iniciarJuego);

    botonReiniciar.addEventListener("click", reiniciarJuego);
    botonPista.addEventListener("click", mostrarPista);
    cerrarPremio.addEventListener("click", cerrarModal);
    verPremio.addEventListener("click", mostrarPremio);

    document.addEventListener("keydown", manejarTeclado);

    modalPremio.addEventListener("click", (evento) => {
        if (evento.target === modalPremio) {
            cerrarModal();
        }
    });

    function iniciarJuego() {
        const documentoSVG = objetoSVG.contentDocument;

        if (!documentoSVG) {
            mensajeJuego.textContent = "No se pudo cargar el dibujo.";
            return;
        }

        piezas = Array.from(documentoSVG.querySelectorAll(".pieza"));

        if (piezas.length === 0) {
            mensajeJuego.textContent =
                "El dibujo se cargó, pero no se encontraron piezas para colorear.";
            return;
        }

        piezas.forEach((pieza, indice) => {
            if (!pieza.id) {
                pieza.id = `pieza-${indice + 1}`;
            }

            pieza.style.cursor = "pointer";
            pieza.style.transition =
                "fill 0.25s ease, filter 0.2s ease, transform 0.2s ease";
            pieza.style.transformBox = "fill-box";
            pieza.style.transformOrigin = "center";

            pieza.setAttribute("tabindex", "0");
            pieza.setAttribute("role", "button");
            pieza.setAttribute("aria-label", "Pieza para colorear");

            pieza.addEventListener("click", () => {
                pintarPieza(pieza);
            });

            pieza.addEventListener("keydown", (evento) => {
                if (evento.key === "Enter" || evento.key === " ") {
                    evento.preventDefault();
                    pintarPieza(pieza);
                }
            });

            pieza.addEventListener("mouseenter", () => {
                pieza.style.filter =
                    "drop-shadow(0 0 5px rgba(233, 79, 152, 0.55))";
            });

            pieza.addEventListener("mouseleave", () => {
                pieza.style.filter = "";
            });
        });

        cargarProgreso();
        actualizarProgreso();

        if (!juegoTerminado) {
            mensajeJuego.textContent =
                "Selecciona un color para comenzar.";
        }
    }

    function seleccionarColor(boton) {
        botonesColor.forEach((otroBoton) => {
            otroBoton.classList.remove("seleccionado");
            otroBoton.setAttribute("aria-pressed", "false");
        });

        boton.classList.add("seleccionado");
        boton.setAttribute("aria-pressed", "true");

        colorSeleccionado = boton.dataset.color;
        nombreSeleccionado =
            nombresColores[colorSeleccionado] || "Color elegido";

        muestraColor.style.backgroundColor = colorSeleccionado;
        nombreColor.textContent = nombreSeleccionado;

        mensajeJuego.textContent =
            `Elegiste ${nombreSeleccionado}. Ahora toca una pieza.`;
    }

    function pintarPieza(pieza) {
        if (juegoTerminado) {
            mensajeJuego.textContent =
                "El dibujo ya está completo. Puedes reiniciarlo para volver a jugar.";
            return;
        }

        if (!colorSeleccionado) {
            mensajeJuego.textContent =
                "Primero selecciona un color de la paleta.";
            animarAviso();
            return;
        }

        const colorAnterior = pieza.dataset.colorPintado || "";

        pieza.style.fill = colorSeleccionado;
        pieza.dataset.colorPintado = colorSeleccionado;

        animarPieza(pieza);

        if (colorAnterior) {
            mensajeJuego.textContent =
                `Cambiaste esta pieza a ${nombreSeleccionado}.`;
        } else {
            mensajeJuego.textContent =
                `¡Muy bien! Pintaste una pieza con ${nombreSeleccionado}.`;
        }

        guardarProgreso();
        actualizarProgreso();
    }

    function animarPieza(pieza) {
        pieza.animate(
            [
                { transform: "scale(1)" },
                { transform: "scale(1.08)" },
                { transform: "scale(0.98)" },
                { transform: "scale(1)" }
            ],
            {
                duration: 380,
                easing: "ease-out"
            }
        );
    }

    function animarAviso() {
        mensajeJuego.animate(
            [
                { transform: "translateX(0)" },
                { transform: "translateX(-7px)" },
                { transform: "translateX(7px)" },
                { transform: "translateX(0)" }
            ],
            {
                duration: 320
            }
        );
    }

    function obtenerPiezasPintadas() {
        return piezas.filter((pieza) => pieza.dataset.colorPintado);
    }

    function actualizarProgreso() {
        if (piezas.length === 0) {
            porcentajeTexto.textContent = "0%";
            barraProgreso.style.width = "0%";
            return;
        }

        const cantidadPintada = obtenerPiezasPintadas().length;
        const porcentaje = Math.round(
            (cantidadPintada / piezas.length) * 100
        );

        porcentajeTexto.textContent = `${porcentaje}%`;
        barraProgreso.style.width = `${porcentaje}%`;

        porcentajeTexto.animate(
            [
                { transform: "scale(1)" },
                { transform: "scale(1.12)" },
                { transform: "scale(1)" }
            ],
            {
                duration: 250
            }
        );

        if (cantidadPintada === piezas.length && !juegoTerminado) {
            terminarJuego();
        }
    }

    function terminarJuego() {
        juegoTerminado = true;
        guardarProgreso();

        porcentajeTexto.textContent = "100%";
        barraProgreso.style.width = "100%";
        mensajeJuego.textContent =
            "¡Felicidades! Terminaste Zarzamorita.";

        abrirModal();
        lanzarConfeti();
    }

    function abrirModal() {
        modalPremio.classList.add("visible");
        modalPremio.setAttribute("aria-hidden", "false");
    }

    function cerrarModal() {
        modalPremio.classList.remove("visible");
        modalPremio.setAttribute("aria-hidden", "true");
    }

    function mostrarPremio() {
        verPremio.textContent = "🎁 Premio desbloqueado";

        mensajeJuego.textContent =
            "¡Premio desbloqueado! Toma una captura y muéstrala al hacer tu pedido.";

        cerrarModal();

        setTimeout(() => {
            lanzarConfeti();
        }, 250);
    }

    function mostrarPista() {
        if (juegoTerminado) {
            mensajeJuego.textContent =
                "Ya completaste todas las piezas.";
            return;
        }

        if (!colorSeleccionado) {
            mensajeJuego.textContent =
                "Selecciona primero uno de los colores.";
            animarAviso();
            return;
        }

        const piezaDisponible = piezas.find(
            (pieza) => !pieza.dataset.colorPintado
        );

        if (!piezaDisponible) {
            return;
        }

        piezaDisponible.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

        piezaDisponible.animate(
            [
                {
                    transform: "scale(1)",
                    filter: "drop-shadow(0 0 0 rgba(233,79,152,0))"
                },
                {
                    transform: "scale(1.12)",
                    filter: "drop-shadow(0 0 10px rgba(233,79,152,0.9))"
                },
                {
                    transform: "scale(1)",
                    filter: "drop-shadow(0 0 0 rgba(233,79,152,0))"
                }
            ],
            {
                duration: 800,
                iterations: 2
            }
        );

        mensajeJuego.textContent =
            "La pieza que se mueve puede ser la siguiente.";
    }

    function reiniciarJuego() {
        const confirmar = window.confirm(
            "¿Quieres borrar todo el dibujo y comenzar de nuevo?"
        );

        if (!confirmar) {
            return;
        }

        piezas.forEach((pieza) => {
            pieza.style.fill = "";
            delete pieza.dataset.colorPintado;
        });

        juegoTerminado = false;
        colorSeleccionado = "";
        nombreSeleccionado = "";

        botonesColor.forEach((boton) => {
            boton.classList.remove("seleccionado");
            boton.setAttribute("aria-pressed", "false");
        });

        muestraColor.style.backgroundColor = "transparent";
        nombreColor.textContent = "Ninguno";
        verPremio.textContent = "Ver mi premio";

        cerrarModal();
        localStorage.removeItem(CLAVE_GUARDADO);

        actualizarProgreso();

        mensajeJuego.textContent =
            "Dibujo reiniciado. Selecciona un color para comenzar.";
    }

    function guardarProgreso() {
        const progreso = {};

        piezas.forEach((pieza) => {
            if (pieza.dataset.colorPintado) {
                progreso[pieza.id] = pieza.dataset.colorPintado;
            }
        });

        const datos = {
            progreso,
            terminado: juegoTerminado
        };

        localStorage.setItem(
            CLAVE_GUARDADO,
            JSON.stringify(datos)
        );
    }

    function cargarProgreso() {
        const guardado = localStorage.getItem(CLAVE_GUARDADO);

        if (!guardado) {
            return;
        }

        try {
            const datos = JSON.parse(guardado);
            const progreso = datos.progreso || {};

            piezas.forEach((pieza) => {
                const colorGuardado = progreso[pieza.id];

                if (colorGuardado) {
                    pieza.style.fill = colorGuardado;
                    pieza.dataset.colorPintado = colorGuardado;
                }
            });

            juegoTerminado =
                obtenerPiezasPintadas().length === piezas.length;

            if (juegoTerminado) {
                mensajeJuego.textContent =
                    "Tu dibujo completo fue recuperado.";
            } else if (Object.keys(progreso).length > 0) {
                mensajeJuego.textContent =
                    "Recuperamos tu progreso guardado.";
            }
        } catch (error) {
            localStorage.removeItem(CLAVE_GUARDADO);
        }
    }

    function manejarTeclado(evento) {
        if (evento.key >= "1" && evento.key <= "8") {
            const indice = Number(evento.key) - 1;
            const boton = botonesColor[indice];

            if (boton) {
                seleccionarColor(boton);
                boton.focus();
            }
        }

        if (evento.key === "Escape") {
            cerrarModal();
        }
    }

    function lanzarConfeti() {
        if (confetiActivo) {
            return;
        }

        confetiActivo = true;

        const contenedor = document.createElement("div");
        contenedor.setAttribute("aria-hidden", "true");

        Object.assign(contenedor.style, {
            position: "fixed",
            inset: "0",
            overflow: "hidden",
            pointerEvents: "none",
            zIndex: "2000"
        });

        const colores = [
            "#e94f98",
            "#a84ed5",
            "#ffd166",
            "#56844d",
            "#76266f",
            "#ffffff"
        ];

        for (let i = 0; i < 85; i++) {
            const piezaConfeti = document.createElement("span");

            const tamaño = 6 + Math.random() * 9;
            const izquierda = Math.random() * 100;
            const retraso = Math.random() * 0.8;
            const duracion = 2.2 + Math.random() * 1.8;
            const rotacion = Math.random() * 720;

            Object.assign(piezaConfeti.style, {
                position: "absolute",
                top: "-20px",
                left: `${izquierda}%`,
                width: `${tamaño}px`,
                height: `${tamaño * 0.65}px`,
                backgroundColor:
                    colores[Math.floor(Math.random() * colores.length)],
                borderRadius: Math.random() > 0.5 ? "50%" : "2px",
                opacity: "0.95",
                animation:
                    `caerConfeti ${duracion}s linear ${retraso}s forwards`,
                transform: `rotate(${rotacion}deg)`
            });

            contenedor.appendChild(piezaConfeti);
        }

        if (!document.getElementById("estilos-confeti")) {
            const estilos = document.createElement("style");
            estilos.id = "estilos-confeti";

            estilos.textContent = `
                @keyframes caerConfeti {
                    0% {
                        transform: translateY(-20px) rotate(0deg);
                        opacity: 1;
                    }

                    100% {
                        transform: translateY(110vh) rotate(720deg);
                        opacity: 0;
                    }
                }
            `;

            document.head.appendChild(estilos);
        }

        document.body.appendChild(contenedor);

        setTimeout(() => {
            contenedor.remove();
            confetiActivo = false;
        }, 5200);
    }
});