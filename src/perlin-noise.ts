// Utility functions for Perlin noise
function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(t: number, a: number, b: number): number {
  return a + t * (b - a);
}

function grad(hash: number, x: number, y: number): number {
  const h = hash & 3; // Convert low 2 bits of hash code
  const u = h < 2 ? x : y; // Into 4 simple gradient directions
  const v = h < 2 ? y : x;
  return (h & 1 ? -u : u) + (h & 2 ? -v : v);
}

// Perlin noise function
export function perlinNoise(x: number, y: number, perm: number[]): number {
  // Calculate the grid cell coordinates
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;

  // Relative x, y within the cell
  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);

  // Compute fade curves for x and y
  const u = fade(xf);
  const v = fade(yf);

  // Hash coordinates of the 4 square corners
  const aa = perm[X] + Y;
  const ab = perm[X] + Y + 1;
  const ba = perm[X + 1] + Y;
  const bb = perm[X + 1] + Y + 1;

  // And add blended results from 4 corners of the square
  const x1 = lerp(u, grad(perm[aa], xf, yf), grad(perm[ba], xf - 1, yf));
  const x2 = lerp(
    u,
    grad(perm[ab], xf, yf - 1),
    grad(perm[bb], xf - 1, yf - 1),
  );

  return lerp(v, x1, x2);
}

export const perm = new Array(512)
  .fill(0)
  .map(() => Math.floor(Math.random() * 256));
