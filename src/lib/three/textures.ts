import * as THREE from "three";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * PROCEDURAL TEXTURES — no external HDRIs or asset downloads.
 *
 * Everything the scene needs (steam sprites, spice motes, slate surface,
 * vignette haze) is generated once on a canvas and cached. Keeps the first
 * paint fast, avoids network waterfalls and prevents asset-404 fallbacks.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const cache = new Map<string, THREE.Texture>();

function makeCanvas(size: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas unavailable");
  return { canvas, ctx };
}

function finish(canvas: HTMLCanvasElement, key: string, options: { srgb?: boolean } = {}): THREE.Texture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = options.srgb === false ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  cache.set(key, texture);
  return texture;
}

/** Soft, slightly irregular puff used for steam particles. */
export function getSteamTexture(): THREE.Texture {
  const key = "steam";
  const cached = cache.get(key);
  if (cached) return cached;

  const size = 128;
  const { canvas, ctx } = makeCanvas(size);
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 2, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255,255,255,0.55)");
  gradient.addColorStop(0.35, "rgba(255,255,255,0.22)");
  gradient.addColorStop(0.75, "rgba(255,255,255,0.05)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Break the perfect circle so puffs do not read as bubbles.
  ctx.globalCompositeOperation = "destination-out";
  for (let i = 0; i < 26; i += 1) {
    const r = 6 + Math.random() * 22;
    ctx.beginPath();
    ctx.arc(Math.random() * size, Math.random() * size, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0,0,0,${0.05 + Math.random() * 0.14})`;
    ctx.fill();
  }
  ctx.globalCompositeOperation = "source-over";

  return finish(canvas, key);
}

/** Tiny warm speck for spice dust / flour motes. */
export function getMoteTexture(): THREE.Texture {
  const key = "mote";
  const cached = cache.get(key);
  if (cached) return cached;

  const size = 64;
  const { canvas, ctx } = makeCanvas(size);
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255,236,196,1)");
  gradient.addColorStop(0.3, "rgba(240,190,120,0.55)");
  gradient.addColorStop(1, "rgba(190,130,60,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return finish(canvas, key);
}

/** Soft round contact shadow used under the plate. */
export function getShadowTexture(): THREE.Texture {
  const key = "shadow";
  const cached = cache.get(key);
  if (cached) return cached;

  const size = 256;
  const { canvas, ctx } = makeCanvas(size);
  const gradient = ctx.createRadialGradient(size / 2, size / 2, size * 0.06, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(0,0,0,0.72)");
  gradient.addColorStop(0.55, "rgba(0,0,0,0.34)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return finish(canvas, key);
}

/**
 * Slate / dark stone surface for the table: a subtle value-noise height map
 * used as a roughness map, plus a matching normal-ish bump via the same canvas.
 */
export function getSlateTexture(): THREE.Texture {
  const key = "slate";
  const cached = cache.get(key);
  if (cached) return cached;

  const size = 512;
  const { canvas, ctx } = makeCanvas(size);
  ctx.fillStyle = "#1a1512";
  ctx.fillRect(0, 0, size, size);

  // Layered noise: large soft blotches + fine grain.
  for (let layer = 0; layer < 3; layer += 1) {
    const count = layer === 0 ? 60 : layer === 1 ? 220 : 1400;
    const radius = layer === 0 ? 90 : layer === 1 ? 26 : 4;
    for (let i = 0; i < count; i += 1) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const value = 12 + Math.random() * 26;
      ctx.beginPath();
      ctx.fillStyle = `rgba(${value + 18},${value + 12},${value + 6},${layer === 2 ? 0.06 : 0.05})`;
      ctx.arc(x, y, radius * (0.5 + Math.random()), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = finish(canvas, key);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
}

/** Disposes every cached canvas texture (used when the scene unmounts). */
export function disposeTextureCache(): void {
  for (const texture of cache.values()) texture.dispose();
  cache.clear();
}
