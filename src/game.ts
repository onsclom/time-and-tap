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
const maxParticles = 100;
const maxIndicators = 20;
const particleMaxLife = 1000;

const state = {
  // indicators: {
  //   target: 0,
  //   player: 0,
  //   life: 0,
  //   maxLife: 1000,
  // },
  indicators: Array(maxIndicators).fill(0).map(() => ({
    angle: 0,
    color: "red",
    life: 0,
  })),
  indicatorIndex: 0,
  target: {
    angle: Math.random() * Math.PI * 2,
    timeAlive: 0,
    // circular array
    particles: Array(maxParticles).fill(0).map(() => ({
      x: 0,
      y: 0,
      angle: 0,
      speed: 0,
      life: 0,
      totalLife: 0,
      color: "red"
    })),
    particleIndex: 0
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
document.onkeydown = (e) => { if (e.key === " ")  state.clicked = true;  };

export function update(dt: number) {
  // handle click before everything! (minimize input lag)
  const hitStun = 30;
  if (state.clicked) {
    state.clicked = false;
    state.dir *= -1;
    state.shakeFactor = 1;

    const playerPos = {
      x: gameSize.width / 2 + Math.cos(state.player.angle) * innerCircleRadius,
      y: gameSize.height / 2 + Math.sin(state.player.angle) * innerCircleRadius,
    };
    const targetPos = {
      x: gameSize.width / 2 + Math.cos(state.target.angle) * innerCircleRadius,
      y: gameSize.height / 2 + Math.sin(state.target.angle) * innerCircleRadius,
    };
    const distance = Math.hypot(
      playerPos.x - targetPos.x,
      playerPos.y - targetPos.y,
    );

    const forgiveness = targetRadius * 0.5;
    if (distance <= targetRadius * 2 + forgiveness) {
      state.indicators[state.indicatorIndex].angle = state.player.angle;
      state.indicators[state.indicatorIndex].color = "blue";
      state.indicators[state.indicatorIndex].life = particleMaxLife;
      state.indicatorIndex = (state.indicatorIndex + 1) % maxIndicators;
      state.indicators[state.indicatorIndex].angle = state.target.angle;
      state.indicators[state.indicatorIndex].color = "red";
      state.indicators[state.indicatorIndex].life = particleMaxLife;
      state.indicatorIndex = (state.indicatorIndex + 1) % maxIndicators;

      state.target.angle = Math.random() * Math.PI * 2;
      state.target.timeAlive = 0;
      state.score += 1;
      state.timeToProcess -= hitStun;


      // spawn particles
      const particleCount = 20;
      for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 0.3 + .1;
        const life = Math.random() * 50 + 50;
        const index = state.target.particleIndex % maxParticles;
        state.target.particles[index] = {
          x: targetPos.x,
          y: targetPos.y,
          angle,
          speed,
          life,
          totalLife: life,
          color: Math.random() > 0.5 ? "red" : "white",
        };
        state.target.particleIndex++;
      }
    }
  }
  state.indicators.forEach(indicator => {
    if (indicator.life > 0) {
      indicator.life -= dt;
    }
  });

  for (let i = 0; i < maxParticles; i++) {
    const particle = state.target.particles[i];
    if (particle.life > 0) {
      particle.x += Math.cos(particle.angle) * particle.speed;
      particle.y += Math.sin(particle.angle) * particle.speed;
      particle.life--;
    }
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
  const shakeWobble = 0.005;
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

  for (let i = 0; i < maxParticles; i++) {
    const particle = state.target.particles[i];
    const size = particle.life / particle.totalLife * 5;
    if (particle.life > 0) {
      ctx.fillStyle = particle.color
      fillCircle(ctx, particle.x, particle.y, size);
    }
  }

  ctx.lineWidth = 1
  state.indicators.forEach((indicator) => {
    if (indicator.life > 0) {
      ctx.strokeStyle = indicator.color;
      ctx.globalAlpha = indicator.life / particleMaxLife;
      strokeCircle(
        ctx,
        gameSize.width / 2 + Math.cos(indicator.angle) * innerCircleRadius,
        gameSize.height / 2 + Math.sin(indicator.angle) * innerCircleRadius,
        targetRadius,
      );
      ctx.globalAlpha = 1;
    }
  });

  const targetFullSizeTime = 300;
  ctx.fillStyle = "red";
  fillCircle(
    ctx,
    gameSize.width / 2 + Math.cos(state.target.angle) * innerCircleRadius,
    gameSize.height / 2 + Math.sin(state.target.angle) * innerCircleRadius,
    targetRadius *
      Math.min(1, (state.target.timeAlive / targetFullSizeTime) ** 2),
  );
  ctx.fillStyle = "white";
  fillCircle(
    ctx,
    gameSize.width / 2 + Math.cos(state.target.angle) * innerCircleRadius,
    gameSize.height / 2 + Math.sin(state.target.angle) * innerCircleRadius,
    targetRadius *
      Math.min(1, (state.target.timeAlive / targetFullSizeTime) ** 2) *
      0.66,
  );
  ctx.fillStyle = "red";
  fillCircle(
    ctx,
    gameSize.width / 2 + Math.cos(state.target.angle) * innerCircleRadius,
    gameSize.height / 2 + Math.sin(state.target.angle) * innerCircleRadius,
    targetRadius *
      Math.min(1, (state.target.timeAlive / targetFullSizeTime) ** 2) *
      0.33,
  );

  ctx.globalAlpha = .2
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
  ctx.globalAlpha = 1
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

function strokeCircle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
}
