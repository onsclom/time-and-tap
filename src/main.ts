import { gameSize, draw, update } from "./game";

const canvas = document.createElement("canvas");
document.body.appendChild(canvas);

let previousTime = performance.now();
(function animationFrame() {
  const currentTime = performance.now();
  const dt = currentTime - previousTime;
  previousTime = currentTime;

  // SETUP
  ////////////////////////////
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2d context");
  const dpi = window.devicePixelRatio;
  canvas.width = window.innerWidth * dpi;
  canvas.height = window.innerHeight * dpi;
  ctx.scale(dpi, dpi);

  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const canvasRect = canvas.getBoundingClientRect();
  {
    // letter box game within canvas
    const canvasRatio = canvasRect.width / canvasRect.height;
    const gameRatio = gameSize.width / gameSize.height;
    const xScale =
      canvasRatio > gameRatio
        ? canvasRect.height / gameSize.height
        : canvasRect.width / gameSize.width;
    const yScale =
      canvasRatio > gameRatio
        ? canvasRect.height / gameSize.height
        : canvasRect.width / gameSize.width;
    ctx.translate(
      (canvasRect.width - gameSize.width * xScale) / 2,
      (canvasRect.height - gameSize.height * yScale) / 2,
    );
    ctx.scale(xScale, yScale);
  }

  update(dt);
  draw(ctx);

  requestAnimationFrame(animationFrame);
})();
