/*******************************************
 * 1. Variables y elementos
 *******************************************/
const canvas = document.getElementById("ruleta");
const ctx = canvas.getContext("2d");
const pointer = document.getElementById("pointer");
const confettiContainer = document.getElementById("confetti-container");
const winMessage = document.getElementById("winMessage");
const btnGirar = document.getElementById("girar");

// PREMIOS
const premios = [
  "10%DCTO", "30%DCTO", "20%DCTO", "SORPRESA",
  "10%DCTO", "20%DCTO", "SORPRESA", "30%DCTO"
];

// Colores de los segmentos
const colores = ["#FF5733", "#FFC300", "#28A745", "#C70039"];

// Ángulos y estados
let anguloActual = 0;
let girando = false;
let idleSpeed = 0.002;
let idlePause = false;

// Para controlar el show de luces
let lightsInterval = null;
let lightsTimeout = null;

/*******************************************
 * 2. Dibujo de la ruleta
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

  for (let i = 0; i < numSegments; i++) {
    const inicioAngulo = i * anguloSegmento;
    const finAngulo = inicioAngulo + anguloSegmento;

    // Segmentos
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
    ctx.font = "700 18px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(premios[i], 0, 0);
    ctx.restore();
  }
}

/*******************************************
 * 3. Animación idle
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
 * 4. Girar con el botón
 *******************************************/
function girarRuleta() {
  if (girando) return;
  if (premios.length === 0) return;

  girando = true;
  idlePause = false;

  // Ocultamos mensaje y paramos el show de luces (si existía)
  winMessage.classList.remove("show-win");
  winMessage.textContent = "";
  stopLightShow();

  const numSegments = premios.length;
  const vueltas = Math.floor(Math.random() * 5) + 5;
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

    // Tick en cada segmento
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

    // Final
    if (progreso < duracion) {
      requestAnimationFrame(animar);
    } else {
      anguloActual = (anguloEnCurso % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
      girando = false;
      mostrarPremio();
    }
  }

  requestAnimationFrame(animar);
}

/*******************************************
 * 5. Mostrar premio + Efectos
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

  // Efectos
  lanzarConfeti();
  lanzarFuegosArtificiales();
  startLightShow(); // Luces parpadeantes

  idlePause = true;
  // Mensaje y show duran 1 minuto
  setTimeout(() => {
    if (winMessage.classList.contains("show-win")) {
      winMessage.classList.remove("show-win");
    }
    stopLightShow(); // Terminamos el show de luces
    idlePause = false;
  }, 60000);
}

/*******************************************
 * 6. Efecto Tick, confeti, cohetes y luces
 *******************************************/
function pointerTick() {
  pointer.classList.add("tick");
  setTimeout(() => {
    pointer.classList.remove("tick");
  }, 100);
}

/* Confeti */
function lanzarConfeti() {
  // Cantidad de confeti incrementada
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

      confeti.style.transform =
        `translateY(${progress * fallDistance}px) rotate(${progress * 360}deg)`;

      if (progress < 1) {
        requestAnimationFrame(fallAnim);
      } else {
        confettiContainer.removeChild(confeti);
      }
    }
    requestAnimationFrame(fallAnim);
  }
}

/* Fuegos artificiales / cohetes */
function lanzarFuegosArtificiales() {
  const cantidad = 30;
  for (let i = 0; i < cantidad; i++) {
    const firework = document.createElement("div");
    firework.classList.add("firework");
    const colorArray = [
      "#ff6b6b", "#f06595", "#845ec2", "#ffc75f", "#ff9671"
    ];
    firework.style.backgroundColor = colorArray[Math.floor(Math.random() * colorArray.length)];
    firework.style.left = Math.random() * window.innerWidth + "px";
    firework.style.top = Math.random() * window.innerHeight + "px";
    confettiContainer.appendChild(firework);

    // Al terminar la animación, se remueve
    firework.addEventListener("animationend", () => {
      firework.remove();
    });
  }
}

/* Show de luces parpadeantes */
function startLightShow() {
  stopLightShow(); // Aseguramos que no haya otro activo

  // Generamos luces cada 300 ms
  lightsInterval = setInterval(() => {
    const light = document.createElement("div");
    light.classList.add("light");

    // Color aleatorio
    const colorArray = ["#ffe600", "#ff00ff", "#00ffff", "#00ff00", "#ff0000"];
    const color = colorArray[Math.floor(Math.random() * colorArray.length)];
    light.style.backgroundColor = color;

    // Posición aleatoria
    light.style.left = Math.random() * window.innerWidth + "px";
    light.style.top = Math.random() * window.innerHeight + "px";

    confettiContainer.appendChild(light);

    // Cada luz desaparece tras 3s
    setTimeout(() => {
      if (light.parentNode) {
        light.remove();
      }
    }, 3000);
  }, 300);
}

/* Detiene el show de luces */
function stopLightShow() {
  if (lightsInterval) {
    clearInterval(lightsInterval);
    lightsInterval = null;
  }
  // Removemos luces existentes
  const lights = document.querySelectorAll(".light");
  lights.forEach((l) => l.remove());
}

/*******************************************
 * 7. Ajustar canvas y eventos
 *******************************************/
function resizeCanvas() {
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
  dibujarRuleta();
}

window.addEventListener("load", () => {
  resizeCanvas();
  girando = false;
  idlePause = false;
  loopIdle();
});

window.addEventListener("resize", resizeCanvas);

/* Al presionar "Girar Ruleta", ocultamos mensaje y paramos luces */
btnGirar.addEventListener("click", () => {
  winMessage.classList.remove("show-win");
  stopLightShow();
  girarRuleta();
});
