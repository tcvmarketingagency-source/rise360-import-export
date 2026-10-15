"use client";

import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Environment, PerspectiveCamera } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { SteamParticles } from "./SteamParticles";
import { getSlateTexture } from "@/lib/three/textures";
import { paintHeroPanel } from "@/lib/three/panelPainting";
import {
  HERO_CAMERA,
  HERO_LIGHTS,
  resolvePanelTransform,
  HERO_MATERIALS,
  HERO_MOTION,
  PANEL_ASPECT,
  PANEL_CROP,
  resolveHeroLayout,
  type HeroLayout,
} from "@/lib/three/hero-rig";
import {
  heroScroll,
  pointerState,
  setPointerTarget,
  stepHeroScroll,
  stepPointer,
} from "@/lib/three/scrollBridge";
import type { DeviceProfile } from "@/lib/webgl";

export type HeroSceneVariant = "plated" | "atmosphere";

export interface HeroSceneProps {
  dishSrc: string;
  variant?: HeroSceneVariant;
  quality?: DeviceProfile;
  reducedMotion?: boolean;
  active?: boolean;
  onReady?: () => void;
}

/* ── Art direction values shared with the CSS panel ───────────────────────── */

const PANEL_TEXTURE_WIDTH: Record<DeviceProfile, number> = { low: 640, mid: 900, high: 1200 };

/**
 * Paint the dish photograph once: cropped around the dish, lightly vignetted,
 * warm sheen from the upper left, feathered into the dark. Identical pixels to
 * the static fallback because it is the same function.
 */
function usePanelTexture(src: string, quality: DeviceProfile): THREE.Texture {
  const loaded = useLoader(THREE.TextureLoader, src);

  return useMemo(() => {
    const image = loaded.image as CanvasImageSource & { width: number; height: number };
    if (!image || typeof document === "undefined") return loaded;

    const width = PANEL_TEXTURE_WIDTH[quality];
    const height = Math.round(width / PANEL_ASPECT);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return loaded;

    paintHeroPanel(ctx, image, { width, height, image: { width: image.width, height: image.height } });

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    texture.needsUpdate = true;
    return texture;
  }, [loaded, quality]);
}

/* ── Lighting rig (values live in hero-rig.ts) ────────────────────────────── */

function StudioLights({ reducedMotion }: { reducedMotion: boolean }) {
  const sweepRef = useRef<THREE.SpotLight>(null);

  useFrame(({ clock }) => {
    const light = sweepRef.current;
    if (!light) return;
    const { radius, height, heightBob, angularSpeed, intensity, intensityPulse } = HERO_LIGHTS.key;

    if (reducedMotion) {
      light.position.set(radius * 0.86, height, radius * 0.5);
      light.intensity = intensity;
      return;
    }

    const t = clock.elapsedTime;
    const angle = t * angularSpeed;
    light.position.set(Math.cos(angle) * radius, height + Math.sin(t * 0.2) * heightBob, Math.sin(angle) * radius);
    // A slow breath of a few percent — never enough to change how dark the
    // frame reads, and never on top of a material's own emission.
    light.intensity = intensity + Math.sin(t * 0.28) * intensityPulse;
  });

  return (
    <>
      <ambientLight intensity={HERO_LIGHTS.ambient.intensity} color={HERO_LIGHTS.ambient.color} />
      <hemisphereLight
        intensity={HERO_LIGHTS.hemisphere.intensity}
        color={HERO_LIGHTS.hemisphere.sky}
        groundColor={HERO_LIGHTS.hemisphere.ground}
      />
      <spotLight
        ref={sweepRef}
        position={[HERO_LIGHTS.key.radius * 0.86, HERO_LIGHTS.key.height, HERO_LIGHTS.key.radius * 0.5]}
        angle={HERO_LIGHTS.key.angle}
        penumbra={HERO_LIGHTS.key.penumbra}
        distance={HERO_LIGHTS.key.distance}
        decay={HERO_LIGHTS.key.decay}
        intensity={HERO_LIGHTS.key.intensity}
        color={HERO_LIGHTS.key.color}
      />
      <directionalLight
        position={HERO_LIGHTS.rim.position as unknown as [number, number, number]}
        intensity={HERO_LIGHTS.rim.intensity}
        color={HERO_LIGHTS.rim.color}
      />
      <pointLight
        position={HERO_LIGHTS.fill.position as unknown as [number, number, number]}
        intensity={HERO_LIGHTS.fill.intensity}
        distance={HERO_LIGHTS.fill.distance}
        decay={HERO_LIGHTS.fill.decay}
        color={HERO_LIGHTS.fill.color}
      />
    </>
  );
}

/** A dark room with one warm soft strip: enough to shape stone, never to flood it. */
function ProceduralEnvironment({ quality }: { quality: DeviceProfile }) {
  return (
    <Environment resolution={quality === "low" ? 32 : 64} frames={1} environmentIntensity={HERO_LIGHTS.envIntensity}>
      <mesh scale={24}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial color="#191009" side={THREE.BackSide} />
      </mesh>
      <mesh position={[3.4, 3.1, 2.2]} rotation={[0, -0.7, 0]}>
        <planeGeometry args={[3.2, 2.2]} />
        <meshBasicMaterial color="#6d4522" />
      </mesh>
      <mesh position={[-3.2, 1.4, -1.6]} rotation={[0, 0.6, 0]}>
        <planeGeometry args={[3.4, 2.6]} />
        <meshBasicMaterial color="#221610" />
      </mesh>
      <mesh position={[0, -2.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 8]} />
        <meshBasicMaterial color="#0f0906" />
      </mesh>
    </Environment>
  );
}

/* ── The subject: the dish photograph, framed by the dark ─────────────────── */

function DishPanel({
  dishSrc,
  quality,
  reducedMotion,
  onReady,
}: {
  dishSrc: string;
  quality: DeviceProfile;
  reducedMotion: boolean;
  onReady?: () => void;
}) {
  const texture = usePanelTexture(dishSrc, quality);
  const { size, camera, invalidate } = useThree();
  const groupRef = useRef<THREE.Group>(null);

  // Composition is resolved from the *canvas* box, so an embedded preview is
  // composed from its own dimensions rather than the window's.
  const layout = useMemo(() => resolveHeroLayout(size.width, size.height), [size.width, size.height]);
  const slate = useMemo(() => getSlateTexture(), []);

  const transform = useMemo(
    () => resolvePanelTransform(layout, size.width, size.height, HERO_CAMERA),
    [layout, size.width, size.height],
  );
  const quaternion = useMemo(
    () =>
      new THREE.Quaternion().setFromRotationMatrix(
        new THREE.Matrix4().makeBasis(
          new THREE.Vector3(...transform.basis.right),
          new THREE.Vector3(...transform.basis.up),
          new THREE.Vector3(...transform.basis.forward).negate(),
        ),
      ),
    [transform],
  );

  useEffect(() => {
    invalidate();
    onReady?.();
  }, [invalidate, onReady, texture]);

  useFrame(({ clock }) => {
    const group = groupRef.current;
    if (!group) return;

    if (reducedMotion) {
      group.rotation.set(0, 0, 0);
      group.position.y = 0;
      return;
    }

    const t = clock.elapsedTime;
    const yaw = THREE.MathUtils.degToRad(HERO_MOTION.yawDegrees);
    const pointerYaw = THREE.MathUtils.degToRad(HERO_MOTION.pointerYawDegrees);
    const pointerPitch = THREE.MathUtils.degToRad(HERO_MOTION.pointerPitchDegrees);

    // A dish on a table: a degree or two of turn, a couple of millimetres of
    // lift. Anything more starts to float.
    group.rotation.y = Math.sin(t * HERO_MOTION.yawSpeed) * yaw + pointerState.x * pointerYaw;
    group.rotation.x = pointerState.y * pointerPitch;
    group.position.y = Math.sin(t * HERO_MOTION.driftSpeed) * HERO_MOTION.driftWorld;
  });

  const steamRadius = Math.max(0.12, (transform.worldWidth * PANEL_CROP.foodRadius) / 2);

  return (
    <group>
      <ProceduralEnvironment quality={quality} />
      <StudioLights reducedMotion={reducedMotion} />

      {/* Dark stone tabletop — tactile, not a backdrop */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.9, 0]}>
        <planeGeometry args={[22, 22]} />
        <meshStandardMaterial
          map={slate}
          color={HERO_MATERIALS.table.color}
          roughness={HERO_MATERIALS.table.roughness}
          metalness={HERO_MATERIALS.table.metalness}
        />
      </mesh>

      {/* Warm pool of light under the subject (additive, very low) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[transform.center[0], -0.89, transform.center[2] + 0.2]}>
        <planeGeometry args={[HERO_MATERIALS.glow.size, HERO_MATERIALS.glow.size]} />
        <meshBasicMaterial
          color={HERO_MATERIALS.glow.color}
          transparent
          opacity={HERO_MATERIALS.glow.opacity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <group ref={groupRef}>
        <group position={transform.center} quaternion={quaternion}>
          <mesh renderOrder={1}>
            <planeGeometry args={[transform.worldWidth, transform.worldHeight]} />
            {/* The dish panel is the same painting the CSS fallback shows, so it
                must not be graded a second time: ACES at exposure 0.86 would
                darken it and the WebGL cross-fade would visibly shift the food.
                Lit surfaces (table, steam) keep the tone-mapped treatment. */}
            <meshBasicMaterial map={texture} transparent depthWrite={false} toneMapped={false} />
          </mesh>
        </group>
      </group>

      {/* Steam rising off the dish in the photograph */}
      <SteamParticles
        count={HERO_MOTION.steamCount[quality]}
        position={[transform.center[0], transform.center[1] + transform.worldHeight * 0.06, transform.center[2] + 0.25]}
        radius={steamRadius}
        rise={1.9}
        spread={0.4}
        sway={0.16}
        size={quality === "low" ? 26 : 34}
        speed={0.045}
        opacity={HERO_MOTION.steamOpacity}
        color="#f6ead6"
      />

      {/* A little spice dust so the light has something to move through */}
      <SteamParticles
        kind="mote"
        count={HERO_MOTION.moteCount[quality]}
        position={[transform.center[0], transform.center[1] - 0.4, transform.center[2] + 0.5]}
        radius={Math.max(0.6, transform.worldWidth * 0.7)}
        rise={1.4}
        spread={0.8}
        sway={0.4}
        size={quality === "low" ? 10 : 14}
        speed={0.07}
        opacity={HERO_MOTION.moteOpacity}
        color="#ffca86"
      />
    </group>
  );
}

/* ── Atmosphere-only variant (lightweight fallback scene) ─────────────────── */

function Atmosphere({ quality }: { quality: DeviceProfile }) {
  return (
    <group>
      <ambientLight intensity={HERO_LIGHTS.ambient.intensity * 2} color={HERO_LIGHTS.ambient.color} />
      <SteamParticles
        count={quality === "low" ? 34 : 64}
        position={[0, -0.9, 0]}
        radius={1.4}
        rise={2.4}
        spread={0.8}
        sway={0.35}
        size={44}
        speed={0.045}
        opacity={0.16}
        color="#f6ead6"
      />
      <SteamParticles
        kind="mote"
        count={quality === "high" ? 70 : 30}
        position={[0, -0.6, 0]}
        radius={2.2}
        rise={2.2}
        spread={1.1}
        sway={0.5}
        size={14}
        speed={0.08}
        opacity={0.45}
        color="#ffca86"
      />
    </group>
  );
}

/* ── Camera choreography ──────────────────────────────────────────────────── */

function CameraRig({ variant, reducedMotion }: { variant: HeroSceneVariant; reducedMotion: boolean }) {
  const { camera, size, invalidate } = useThree();
  const base = useRef(new THREE.Vector3(...HERO_CAMERA.position));

  useEffect(() => {
    base.current.set(
      HERO_CAMERA.position[0],
      variant === "atmosphere" ? 0 : size.width < 720 ? HERO_CAMERA.position[1] * 1.08 : HERO_CAMERA.position[1],
      variant === "atmosphere" ? 3.4 : size.width < 720 ? HERO_CAMERA.position[2] * 1.1 : HERO_CAMERA.position[2],
    );
    invalidate();
  }, [size.width, variant, invalidate]);

  useEffect(() => {
    const handler = (event: PointerEvent) => {
      setPointerTarget(
        (event.clientX / window.innerWidth) * 2 - 1,
        (event.clientY / window.innerHeight) * 2 - 1,
      );
    };
    window.addEventListener("pointermove", handler, { passive: true });
    return () => window.removeEventListener("pointermove", handler);
  }, []);

  useFrame(({ clock }) => {
    stepPointer(0.045);
    stepHeroScroll(0.075);

    const look = new THREE.Vector3(...HERO_CAMERA.target);

    if (reducedMotion) {
      camera.position.copy(base.current);
      camera.lookAt(look);
      return;
    }

    const t = clock.elapsedTime;
    const s = heroScroll.eased;

    if (variant === "atmosphere") {
      camera.position.set(pointerState.x * 0.18, -pointerState.y * 0.14, base.current.z - s * 0.4);
      camera.lookAt(0, 0, 0);
      return;
    }

    // Progressive, scroll-linked drift: no states to jump between, and the
    // pointer only ever adds a fraction of a unit.
    camera.position.set(
      pointerState.x * 0.22 + Math.sin(t * HERO_MOTION.cameraDriftSpeed) * HERO_MOTION.cameraDrift,
      base.current.y + pointerState.y * 0.12 + s * HERO_MOTION.cameraScrollRise + Math.sin(t * 0.17) * 0.018,
      base.current.z - s * HERO_MOTION.cameraScrollDolly,
    );
    camera.lookAt(look.x, look.y + s * 0.16, look.z);
  });

  return null;
}

/* ── Canvas ───────────────────────────────────────────────────────────────── */

export default function HeroScene({
  dishSrc,
  variant = "plated",
  quality = "mid",
  reducedMotion = false,
  active = true,
  onReady,
}: HeroSceneProps) {
  const dpr = useMemo<[number, number]>(() => {
    if (quality === "high") return [1, 2];
    if (quality === "mid") return [1, 1.5];
    return [1, 1.2];
  }, [quality]);

  const fov = variant === "atmosphere" ? 42 : HERO_CAMERA.fov;

  return (
    <Canvas
      dpr={dpr}
      frameloop={active && !reducedMotion ? "always" : "demand"}
      camera={{ fov, position: [...HERO_CAMERA.position], near: 0.1, far: 40 }}
      gl={{
        antialias: quality !== "low",
        alpha: true,
        powerPreference: "high-performance",
        stencil: false,
        depth: true,
      }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = HERO_LIGHTS.exposure;
        gl.outputColorSpace = THREE.SRGBColorSpace;
      }}
      style={{ position: "absolute", inset: 0, background: "transparent" }}
      data-testid="hero-canvas"
    >
      <PerspectiveCamera makeDefault fov={fov} position={[...HERO_CAMERA.position]} />
      <Suspense fallback={null}>
        {variant === "plated" ? (
          <DishPanel
            dishSrc={dishSrc}
            quality={quality}
            reducedMotion={reducedMotion}
            onReady={onReady}
          />
        ) : (
          <Atmosphere quality={quality} />
        )}
      </Suspense>
      <CameraRig variant={variant} reducedMotion={reducedMotion} />
    </Canvas>
  );
}
