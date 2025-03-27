/*******************************************
 * 1. Variables y elementos
 *******************************************/
const canvas = document.getElementById("ruleta");
const ctx = canvas.getContext("2d");
const pointer = document.getElementById("pointer");
const confettiContainer = document.getElementById("confetti-container");
const winMessage = document.getElementById("winMessage");
const btnGirar = document.getElementById("girar");

// PREMIOS (ejemplo)
const premios = [
  "10%", "20%", "30%", "🎁",
  "10%", "20%", "10%", "30%", 
  "10%", "20%", "30%", "10%", 
  "20%", "10%", "20%", "10%"
];

// Colores de los segmentos
const colores = ["#FF5733", "#FFC300", "#28A745", "#C70039"];

// Ángulos y estados
let anguloActual = 0;
let girando = false;
let idleSpeed = 0.002;
let idlePause = false;

// Control show de luces
let lightsInterval = null;

/*******************************************
 * 2. Función para elegir tamaño de fuente
 *******************************************/
function getResponsiveFontSize(canvasWidth) {
  if (canvasWidth < 200) {
    return "700 12px Inter, sans-serif";
  } else if (canvasWidth < 300) {
    return "700 14px Inter, sans-serif";
  } else if (canvasWidth < 400) {
    return "700 16px Inter, sans-serif";
  } else {
    return "700 18px Inter, sans-serif";
  }
}

/*******************************************
 * 3. Dibujo de la ruleta
 *******************************************/
function dibujarRuleta() {
  const w = canvas.width;
  const h = canvas.height;
  const centerX = w / 2;
  const centerY = h / 2;
  const radio = Math.min(w, h) / 2;

  ctx.clearRect(0, 0, w, h);

  const numSegments = premios.length;
  const anguloSegmento = (2 * Math.PI) / numSegments;

  // Fuente responsiva
  const dynamicFont = getResponsiveFontSize(w);

  for (let i = 0; i < numSegments; i++) {
    const inicioAngulo = i * anguloSegmento;
    const finAngulo = inicioAngulo + anguloSegmento;

    // Dibujar segmento
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radio, inicioAngulo, finAngulo);
    ctx.fillStyle = colores[i % colores.length];
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();

    // Texto
    ctx.save();
    const anguloTexto = inicioAngulo + anguloSegmento / 2;
    const textRadius = radio * 0.6;
    const xPos = centerX + Math.cos(anguloTexto) * textRadius;
    const yPos = centerY + Math.sin(anguloTexto) * textRadius;

    ctx.translate(xPos, yPos);
    ctx.rotate(anguloTexto + Math.PI / 2);

    ctx.fillStyle = "#fff";
    ctx.font = dynamicFont;
    ctx.textAlign = "center";
    ctx.fillText(premios[i], 0, 0);
    ctx.restore();
  }
}

/*******************************************
 * 4. Animación idle
 *******************************************/
function loopIdle() {
  if (!girando && !idlePause) {
    anguloActual += idleSpeed;
    actualizarRuleta(anguloActual);
  }
  requestAnimationFrame(loopIdle);
}

function actualizarRuleta(angulo) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(angulo);
  ctx.translate(-canvas.width / 2, -canvas.height / 2);
  dibujarRuleta();
  ctx.restore();
}

function easeOutQuad(t) {
  return t * (2 - t);
}

/*******************************************
 * 5. Función para girar con botón
 *******************************************/
function girarRuleta() {
  if (girando) return;
  if (premios.length === 0) return;

  girando = true;
  idlePause = false;

  // Ocultar mensaje
  winMessage.classList.remove("show-win");
  winMessage.textContent = "";
  stopLightShow();

  const numSegments = premios.length;
  const vueltas = Math.floor(Math.random() * 5) + 5; // 5 a 9 vueltas
  const anguloFinal = Math.random() * 2 * Math.PI;
  const giroTotal = vueltas * 2 * Math.PI + anguloFinal;
  const duracion = 4000;

  let inicioAnimacion = null;
  let lastSegment = -1;

  function animar(timestamp) {
    if (!inicioAnimacion) inicioAnimacion = timestamp;
    const progreso = timestamp - inicioAnimacion;
    const t = progreso / duracion;
    const easedT = easeOutQuad(t);

    const anguloEnCurso = anguloActual + giroTotal * easedT;
    actualizarRuleta(anguloEnCurso);

    // Detectamos cambio de segmento para tick
    if (numSegments > 0) {
      const anguloSegmento = (2 * Math.PI) / numSegments;
      let anguloPositivo = anguloEnCurso % (2 * Math.PI);
      if (anguloPositivo < 0) anguloPositivo += 2 * Math.PI;
      let currentSegment = Math.floor(anguloPositivo / anguloSegmento);
      if (currentSegment !== lastSegment) {
        pointerTick();
        lastSegment = currentSegment;
      }
    }

    if (progreso < duracion) {
      requestAnimationFrame(animar);
    } else {
      // Normalizamos el ángulo final
      anguloActual = (anguloEnCurso % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
      girando = false;
      mostrarPremio();
    }
  }

  requestAnimationFrame(animar);
}

/*******************************************
 * 6. Mostrar premio + Efectos
 *******************************************/
function mostrarPremio() {
  const numSegments = premios.length;
  if (numSegments === 0) return;

  const anguloSegmento = (2 * Math.PI) / numSegments;
  const pointerAngle = (2 * Math.PI - anguloActual) % (2 * Math.PI);
  const indiceGanador = Math.floor(pointerAngle / anguloSegmento);
  const premioGanador = premios[indiceGanador];

  winMessage.textContent = `¡Ganaste: ${premioGanador}!`;
  winMessage.classList.add("show-win");

  lanzarConfeti();
  lanzarFuegosArtificiales();
  startLightShow();

  idlePause = true;
  // Ocultar después de 1 minuto
  setTimeout(() => {
    if (winMessage.classList.contains("show-win")) {
      winMessage.classList.remove("show-win");
    }
    stopLightShow();
    idlePause = false;
  }, 60000);
}

/*******************************************
 * 7. Tick + Confeti + Fuegos + Luces
 *******************************************/
function pointerTick() {
  pointer.classList.add("tick");
  setTimeout(() => {
    pointer.classList.remove("tick");
  }, 100);
}

function lanzarConfeti() {
  const cantidad = 120;
  for (let i = 0; i < cantidad; i++) {
    const confeti = document.createElement("div");
    confeti.style.position = "absolute";
    const size = Math.floor(Math.random() * 10) + 8;
    confeti.style.width = size + "px";
    confeti.style.height = size + "px";

    const colorArray = [
      "#f94144","#f3722c","#f8961e","#f9844a","#f9c74f",
      "#90be6d","#43aa8b","#577590","#277da1"
    ];
    const color = colorArray[Math.floor(Math.random() * colorArray.length)];
    confeti.style.backgroundColor = color;

    confeti.style.top = "0px";
    confeti.style.left = Math.random() * 100 + "%";
    confeti.style.opacity = "0.9";

    confettiContainer.appendChild(confeti);

    const fallDuration = Math.random() * 2000 + 2000;
    const fallDistance = window.innerHeight + 100;

    let startTime = null;
    function fallAnim(time) {
      if (!startTime) startTime = time;
      let elapsed = time - startTime;
      let progress = elapsed / fallDuration;
      if (progress > 1) progress = 1;

      confeti.style.transform = `translateY(${progress * fallDistance}px) rotate(${progress * 360}deg)`;
      if (progress < 1) {
        requestAnimationFrame(fallAnim);
      } else {
        confettiContainer.removeChild(confeti);
      }
    }
    requestAnimationFrame(fallAnim);
  }
}

function lanzarFuegosArtificiales() {
  const cantidad = 30;
  for (let i = 0; i < cantidad; i++) {
    const firework = document.createElement("div");
    firework.classList.add("firework");
    const colorArray = ["#ff6b6b", "#f06595", "#845ec2", "#ffc75f", "#ff9671"];
    firework.style.backgroundColor = colorArray[Math.floor(Math.random() * colorArray.length)];
    firework.style.left = Math.random() * window.innerWidth + "px";
    firework.style.top = Math.random() * window.innerHeight + "px";
    confettiContainer.appendChild(firework);

    firework.addEventListener("animationend", () => {
      firework.remove();
    });
  }
}

function startLightShow() {
  stopLightShow();
  lightsInterval = setInterval(() => {
    const light = document.createElement("div");
    light.classList.add("light");

    const colorArray = ["#ffe600", "#ff00ff", "#00ffff", "#00ff00", "#ff0000"];
    const color = colorArray[Math.floor(Math.random() * colorArray.length)];
    light.style.backgroundColor = color;

    light.style.left = Math.random() * window.innerWidth + "px";
    light.style.top = Math.random() * window.innerHeight + "px";

    confettiContainer.appendChild(light);

    setTimeout(() => {
      if (light.parentNode) {
        light.remove();
      }
    }, 3000);
  }, 300);
}

function stopLightShow() {
  if (lightsInterval) {
    clearInterval(lightsInterval);
    lightsInterval = null;
  }
  document.querySelectorAll(".light").forEach((l) => l.remove());
}

/*******************************************
 * 8. Ajustar canvas y eventos
 *******************************************/
function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
  dibujarRuleta();
}

/**************************************************************
 * GENERAR STICKERS ESTÁTICOS (SIN SUPERPOSICIÓN)
 **************************************************************/
function generarStickersEstaticos() {
  const stickersContainer = document.getElementById("stickers-container");
  if (!stickersContainer) return;

  // Se han ajustado posiciones y escala para evitar solapamientos
  const stickersData = [
    { top: "12%", left: "15%", scale: 0.2, rotate: 0,  opacity: 0.15 },
    { top: "15%", left: "85%", scale: 0.2, rotate: 0,  opacity: 0.15 },
    { top: "40%", left: "20%", scale: 0.2, rotate: 0,  opacity: 0.15 },
    { top: "50%", left: "80%", scale: 0.2, rotate: 0,  opacity: 0.15 },
    { top: "70%", left: "25%", scale: 0.2, rotate: 0,  opacity: 0.15 },
    { top: "80%", left: "75%", scale: 0.2, rotate: 0,  opacity: 0.15 }
  ];

  const stickerSrc = "./Recurso 1@4x.png";

  stickersData.forEach((data) => {
    const sticker = document.createElement("img");
    sticker.src = stickerSrc;
    sticker.classList.add("sticker");

    // Posición
    sticker.style.top = data.top;
    sticker.style.left = data.left;

    // Opacidad
    sticker.style.opacity = data.opacity;

    // Transform (translate center, scale, rotate)
    sticker.style.transform = `translate(-50%, -50%) scale(${data.scale}) rotate(${data.rotate}deg)`;

    stickersContainer.appendChild(sticker);
  });
}

//--------------------------------------------------
window.addEventListener("load", () => {
  resizeCanvas();
  girando = false;
  idlePause = false;
  loopIdle();

  // Generar stickers ESTÁTICOS sin superposición
  generarStickersEstaticos();
});

window.addEventListener("resize", resizeCanvas);

btnGirar.addEventListener("click", () => {
  winMessage.classList.remove("show-win");
  stopLightShow();
  girarRuleta();
});