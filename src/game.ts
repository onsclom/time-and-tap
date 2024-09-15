import { perlinNoise, perm } from "./perlin-noise";

export const gameSize = {
  width: 100,
  height: 100,
};

const targetRadius = 5;
const margin = 5;
const innerCircleRadius = gameSize.width / 2 - targetRadius - margin;

const physicStepsPerSec = 500; // for trail animation
const trailTime = 50; // ms
const trailSize = physicStepsPerSec * (trailTime / 1000);

const state = {
  target: {
    angle: Math.random() * Math.PI * 2,
    timeAlive: 0,
  },
  dir: 1,
  player: {
    angle: 0,
    // circular array
    trail: Array(trailSize).fill(0) as number[],
    trailIndex: 0,
  },
  current: 0,
  score: 0,
  clicked: false,
  timeToProcess: 0,
  shakeFactor: 0,
};

document.onpointerdown = () => (state.clicked = true);
document.onkeydown = (e) => {
  if (e.key === " ") {
    state.clicked = true;
  }
};

export function update(dt: number) {
  // handle click before everything! (minimize input lag)
  const hitStun = 30;
  if (state.clicked) {
    state.clicked = false;
    state.dir *= -1;
    state.target.angle = Math.random() * Math.PI * 2;
    state.target.timeAlive = 0;
    state.score += 1;
    state.shakeFactor = 1;
    state.timeToProcess -= hitStun;
  }

  state.timeToProcess += dt;
  const physicStep = 1000 / physicStepsPerSec;
  while (state.timeToProcess > physicStep) {
    state.timeToProcess -= physicStep;
    state.player.angle += physicStep * 0.005 * state.dir;
    state.target.timeAlive += physicStep;

    state.player.trail[state.player.trailIndex % trailSize] =
      state.player.angle;
    state.player.trailIndex = (state.player.trailIndex + 1) % trailSize;

    // shake decay
    const shakeDecay = 0.02;
    state.shakeFactor *= 1 - shakeDecay;
  }
}

export function draw(ctx: CanvasRenderingContext2D) {
  // do shaking
  const shakeStrength = 10;
  const shakeWobble = 0.01;
  const shakeX =
    perlinNoise(performance.now() * shakeWobble, 0, perm) *
    state.shakeFactor *
    shakeStrength;
  const shakeY =
    perlinNoise(0, performance.now() * shakeWobble, perm) *
    state.shakeFactor *
    shakeStrength;
  ctx.translate(shakeX, shakeY);

  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, gameSize.width, gameSize.height);

  const targetFullSizeTime = 300;
  ctx.fillStyle = "red";
  fillCircle(
    ctx,
    gameSize.width / 2 + Math.cos(state.target.angle) * innerCircleRadius,
    gameSize.height / 2 + Math.sin(state.target.angle) * innerCircleRadius,
    targetRadius *
      Math.min(1, (state.target.timeAlive / targetFullSizeTime) ** 2),
  );

  ctx.fillStyle = "blue";
  for (let i = 0; i < trailSize; i++) {
    const trail = state.player.trail[(state.player.trailIndex + i) % trailSize];
    const scaleFactor = (i / trailSize) * 0.5 + 0.5;
    fillCircle(
      ctx,
      gameSize.width / 2 + Math.cos(trail) * innerCircleRadius,
      gameSize.height / 2 + Math.sin(trail) * innerCircleRadius,
      targetRadius * scaleFactor,
    );
  }

  ctx.globalAlpha = 1;
  fillCircle(
    ctx,
    gameSize.width / 2 + Math.cos(state.player.angle) * innerCircleRadius,
    gameSize.height / 2 + Math.sin(state.player.angle) * innerCircleRadius,
    targetRadius,
  );
}

function fillCircle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}
