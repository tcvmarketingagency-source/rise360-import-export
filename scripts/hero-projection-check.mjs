/**
 * Offline projection check: does the 3D panel land exactly on the box the CSS
 * fallback occupies, and does it face the camera? Uses the app's own
 * `resolveHeroLayout` + `resolvePanelTransform` + `HERO_CAMERA`, so this checks
 * the real code path (minus the quaternion, rebuilt here the same way the scene
 * builds it). No WebGL required.
 *
 * Run with `npx tsx scripts/hero-projection-check.mjs` (the art-direction module
 * is TypeScript; tsx is fetched on demand rather than added as a dependency).
 */
import * as THREE from "three";
import { HERO_CAMERA, resolveHeroLayout, resolvePanelTransform } from "../src/lib/three/hero-rig.ts";

const VIEWPORTS = [
  [1440, 900], [1280, 800], [1024, 768], [786, 714], [768, 700],
  [700, 900], [480, 900], [430, 932], [390, 844], [360, 800], [320, 640],
];

let worst = 0;
let failures = 0;
for (const [W, H] of VIEWPORTS) {
  const layout = resolveHeroLayout(W, H);
  const transform = resolvePanelTransform(layout, W, H, HERO_CAMERA);

  const camera = new THREE.PerspectiveCamera(HERO_CAMERA.fov, W / H, 0.1, 40);
  camera.position.set(...HERO_CAMERA.position);
  camera.lookAt(new THREE.Vector3(...HERO_CAMERA.target));
  camera.updateMatrixWorld(true);

  const quaternion = new THREE.Quaternion().setFromRotationMatrix(
    new THREE.Matrix4().makeBasis(
      new THREE.Vector3(...transform.basis.right),
      new THREE.Vector3(...transform.basis.up),
      new THREE.Vector3(...transform.basis.forward).negate(),
    ),
  );
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(transform.worldWidth, transform.worldHeight),
    new THREE.MeshBasicMaterial(),
  );
  mesh.position.set(...transform.center);
  mesh.quaternion.copy(quaternion);
  mesh.updateMatrixWorld(true);

  const half = [transform.worldWidth / 2, transform.worldHeight / 2];
  const projected = [];
  for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    const corner = new THREE.Vector3(sx * half[0], sy * half[1], 0);
    corner.applyMatrix4(mesh.matrixWorld);
    corner.project(camera);
    projected.push([((corner.x + 1) / 2) * W, ((1 - corner.y) / 2) * H]);
  }
  const xs = projected.map((p) => p[0]);
  const ys = projected.map((p) => p[1]);
  const box = { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };

  const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(quaternion);
  const toCamera = new THREE.Vector3(...HERO_CAMERA.position).sub(mesh.position).normalize();
  const facesCamera = normal.dot(toCamera) > 0.5;

  const dx = Math.abs(box.x - layout.panel.x);
  const dy = Math.abs(box.y - layout.panel.y);
  const dw = Math.abs(box.w - layout.panel.width);
  const dh = Math.abs(box.h - layout.panel.height);
  const delta = Math.max(dx, dy, dw, dh);
  worst = Math.max(worst, delta);
  if (delta > 2 || !facesCamera) failures += 1;

  console.log(
    `${String(W).padStart(4)}x${String(H).padEnd(4)} ${layout.mode.padEnd(7)} ` +
      `css ${Math.round(layout.panel.x)},${Math.round(layout.panel.y)} ${Math.round(layout.panel.width)}x${Math.round(layout.panel.height)} | ` +
      `projected ${Math.round(box.x)},${Math.round(box.y)} ${Math.round(box.w)}x${Math.round(box.h)} | ` +
      `Δ ${delta.toFixed(2)}px | faces camera: ${facesCamera ? "yes" : "NO"} | world ${transform.worldWidth.toFixed(2)}x${transform.worldHeight.toFixed(2)} at depth ${transform.depth.toFixed(2)}`,
  );
}
console.log(`\nworst corner/edge delta: ${worst.toFixed(2)}px · failures: ${failures}`);
process.exit(failures === 0 ? 0 : 1);
