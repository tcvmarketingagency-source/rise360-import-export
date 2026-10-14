/**
 * WebGL capability probe.
 *
 * Called once and cached. When this returns false the hero renders its
 * photographic fallback layer — the page never depends on 3D to be complete.
 */
let cached: boolean | null = null;

export function supportsWebGL(): boolean {
  if (typeof window === "undefined") return false;
  if (cached !== null) return cached;

  try {
    const canvas = document.createElement("canvas");
    const context =
      canvas.getContext("webgl2") ??
      canvas.getContext("webgl") ??
      canvas.getContext("experimental-webgl");
    cached = Boolean(context);
    // Release the probe context immediately.
    if (context && "getExtension" in context) {
      const lose = (context as WebGLRenderingContext).getExtension("WEBGL_lose_context");
      lose?.loseContext();
    }
  } catch {
    cached = false;
  }

  return cached;
}

/** Explicit override for QA: `?no3d=1` forces the fallback, `?force3d=1` the scene. */
export function shouldRender3D(): boolean {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  if (params.get("no3d") === "1") return false;
  if (params.get("force3d") === "1") return supportsWebGL();
  return supportsWebGL();
}

export type DeviceProfile = "low" | "mid" | "high";

/**
 * Cheap device heuristic used to scale the 3D scene: DPR cap, particle counts,
 * shadow quality and post-processing all key off this single value.
 */
export function getDeviceProfile(): DeviceProfile {
  if (typeof window === "undefined") return "mid";
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  const cores = navigator.hardwareConcurrency ?? 4;
  const mobile = window.matchMedia("(max-width: 767px)").matches;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduced || memory <= 2 || cores <= 2) return "low";
  if (mobile || memory <= 4 || cores <= 4) return "mid";
  return "high";
}
