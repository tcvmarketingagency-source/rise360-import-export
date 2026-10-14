"use client";

import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Environment, PerspectiveCamera } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { SteamParticles } from "./SteamParticles";
import { getShadowTexture, getSlateTexture } from "@/lib/three/textures";
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

/* ── Plate profile ────────────────────────────────────────────────────────── */

function buildPlateProfile(): THREE.Vector2[] {
  return [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.62, 0.006),
    new THREE.Vector2(0.92, 0.026),
    new THREE.Vector2(1.08, 0.072),
    new THREE.Vector2(1.19, 0.152),
    new THREE.Vector2(1.235, 0.19),
    new THREE.Vector2(1.192, 0.196),
    new THREE.Vector2(1.0, 0.125),
    new THREE.Vector2(0.62, 0.064),
    new THREE.Vector2(0.0, 0.05),
  ];
}

/**
 * The photographic dish is mapped onto a disc and alpha-masked with a soft
 * radial falloff, so real food imagery sits *inside* a real 3D ceramic plate
 * instead of being pasted on top of the scene.
 */
function useMaskedDishTexture(src: string): THREE.Texture {
  const texture = useLoader(THREE.TextureLoader, src);

  return useMemo(() => {
    const image = texture.image as HTMLImageElement | undefined;
    if (!image || typeof document === "undefined") return texture;

    const size = 1024;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return texture;

    const scale = Math.max(size / image.width, size / image.height);
    const drawWidth = image.width * scale;
    const drawHeight = image.height * scale;
    ctx.drawImage(image, (size - drawWidth) / 2, (size - drawHeight) / 2, drawWidth, drawHeight);

    // Circular mask so the photo melts into the plate rather than ending abruptly.
    ctx.globalCompositeOperation = "destination-in";
    const mask = ctx.createRadialGradient(size / 2, size / 2, size * 0.2, size / 2, size / 2, size * 0.47);
    mask.addColorStop(0, "rgba(0,0,0,1)");
    mask.addColorStop(0.74, "rgba(0,0,0,0.97)");
    mask.addColorStop(0.93, "rgba(0,0,0,0.4)");
    mask.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = mask;
    ctx.fillRect(0, 0, size, size);
    ctx.globalCompositeOperation = "source-over";

    const masked = new THREE.CanvasTexture(canvas);
    masked.colorSpace = THREE.SRGBColorSpace;
    masked.anisotropy = 4;
    return masked;
  }, [texture]);
}

/* ── Lighting ─────────────────────────────────────────────────────────────── */

function StudioLights({ reducedMotion }: { reducedMotion: boolean }) {
  const sweepRef = useRef<THREE.SpotLight>(null);
  const counterRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    if (reducedMotion) return;
    const t = clock.elapsedTime;
    if (sweepRef.current) {
      const angle = t * 0.16;
      sweepRef.current.position.set(
        Math.cos(angle) * 2.7,
        2.5 + Math.sin(t * 0.22) * 0.24,
        Math.sin(angle) * 2.7,
      );
      // One slow, confident pass of light rather than a strobing effect.
      sweepRef.current.intensity = 26 + Math.sin(t * 0.3) * 7;
    }
    if (counterRef.current) {
      counterRef.current.intensity = 4 + Math.sin(t * 0.45 + 1.2) * 1.4;
    }
  });

  return (
    <>
      <ambientLight intensity={0.42} color="#ffdcb0" />
      <hemisphereLight intensity={0.22} color="#ffd9a4" groundColor="#120c08" />
      <spotLight
        ref={sweepRef}
        position={[2.7, 2.5, 1.4]}
        angle={0.62}
        penumbra={1}
        distance={11}
        decay={2}
        intensity={26}
        color="#ffc98d"
      />
      <directionalLight position={[-3.2, 2.4, -2.6]} intensity={0.75} color="#9a6231" />
      <pointLight
        ref={counterRef}
        position={[0, 0.85, 0.7]}
        intensity={4}
        distance={4}
        decay={2}
        color="#ffb469"
      />
    </>
  );
}

function ProceduralEnvironment({ quality }: { quality: DeviceProfile }) {
  return (
    <Environment resolution={quality === "low" ? 32 : 64} frames={1}>
      <mesh scale={24}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial color="#241812" side={THREE.BackSide} />
      </mesh>
      {/* Warm studio softbox upper right — gives the ceramic its sheen. */}
      <mesh position={[3.4, 3.1, 2.2]} rotation={[0, -0.7, 0]}>
        <planeGeometry args={[3.2, 2.2]} />
        <meshBasicMaterial color="#ffb469" />
      </mesh>
      <mesh position={[-3.2, 1.4, -1.6]} rotation={[0, 0.6, 0]}>
        <planeGeometry args={[3.4, 2.6]} />
        <meshBasicMaterial color="#40281a" />
      </mesh>
      <mesh position={[0, -2.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 8]} />
        <meshBasicMaterial color="#150d08" />
      </mesh>
    </Environment>
  );
}

/* ── Plated scene ─────────────────────────────────────────────────────────── */

function PlatedDish({
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
  const dishTexture = useMaskedDishTexture(dishSrc);
  const plateProfile = useMemo(() => buildPlateProfile(), []);
  const slate = useMemo(() => getSlateTexture(), []);
  const shadow = useMemo(() => getShadowTexture(), []);
  const plateRef = useRef<THREE.Group>(null);
  const dishRef = useRef<THREE.Mesh>(null);
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    // Makes sure the first painted frame happens after the photo has decoded.
    invalidate();
    onReady?.();
  }, [invalidate, onReady]);

  useFrame(({ clock }) => {
    if (reducedMotion) return;
    const t = clock.elapsedTime;
    if (plateRef.current) {
      plateRef.current.rotation.y = Math.sin(t * 0.09) * 0.035 + pointerState.x * 0.05;
      plateRef.current.position.y = Math.sin(t * 0.35) * 0.004;
    }
    if (dishRef.current) {
      const material = dishRef.current.material as THREE.MeshStandardMaterial;
      // Kitchen-warm light breathing across the surface of the dish.
      material.emissiveIntensity = 0.62 + Math.sin(t * 0.4) * 0.06;
    }
  });

  return (
    <group>
      <ProceduralEnvironment quality={quality} />
      <StudioLights reducedMotion={reducedMotion} />

      {/* Dark slate table */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 0]}>
        <planeGeometry args={[18, 18]} />
        <meshStandardMaterial map={slate} color="#3a2c22" roughness={0.78} metalness={0.06} />
      </mesh>

      {/* Art-directed contact shadow instead of a shadow map: cheaper, calmer */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.0016, 0]}>
        <planeGeometry args={[3.5, 3.5]} />
        <meshBasicMaterial map={shadow} transparent opacity={0.92} depthWrite={false} />
      </mesh>

      <group ref={plateRef}>
        <mesh>
          <latheGeometry args={[plateProfile, quality === "low" ? 48 : 96]} />
          <meshPhysicalMaterial
            color="#eee4d4"
            roughness={0.3}
            metalness={0}
            clearcoat={0.55}
            clearcoatRoughness={0.35}
            envMapIntensity={0.85}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Thin warm brass rim — catches the moving studio light */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.2, 0]}>
          <torusGeometry args={[1.212, 0.011, 12, quality === "low" ? 64 : 128]} />
          <meshStandardMaterial color="#c9973f" metalness={0.92} roughness={0.28} envMapIntensity={1.1} />
        </mesh>

        {/* The dish itself — real photography, masked, lit as a surface */}
        <mesh ref={dishRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.058, 0]}>
          <circleGeometry args={[0.94, quality === "low" ? 48 : 96]} />
          <meshStandardMaterial
            map={dishTexture}
            emissiveMap={dishTexture}
            emissive="#ffffff"
            emissiveIntensity={0.62}
            roughness={0.55}
            metalness={0.02}
            transparent
            alphaTest={0.02}
          />
        </mesh>
      </group>

      {/* Steam rising off the plate */}
      <SteamParticles
        count={quality === "low" ? 40 : quality === "mid" ? 78 : 120}
        position={[0, 0.12, 0]}
        radius={0.48}
        rise={2.3}
        spread={0.45}
        sway={0.2}
        size={quality === "low" ? 30 : 38}
        speed={0.05}
        opacity={0.24}
        color="#f6ead6"
      />

      {/* Spice motes drifting through the light */}
      <SteamParticles
        kind="mote"
        count={quality === "high" ? 90 : quality === "mid" ? 48 : 24}
        position={[0, 0.25, 0]}
        radius={1.7}
        rise={1.5}
        spread={0.9}
        sway={0.5}
        size={quality === "low" ? 12 : 16}
        speed={0.09}
        opacity={0.5}
        color="#ffca86"
      />
    </group>
  );
}

/* ── Atmosphere-only variant (lightweight fallback scene) ─────────────────── */

function Atmosphere({ quality }: { quality: DeviceProfile }) {
  return (
    <group>
      <ambientLight intensity={0.4} color="#ffdcb0" />
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
  const base = useRef(new THREE.Vector3(0, 1.52, 3.65));

  useEffect(() => {
    const narrow = size.width < 720;
    base.current.set(
      0,
      variant === "atmosphere" ? 0 : narrow ? 1.95 : 1.52,
      variant === "atmosphere" ? 3.2 : narrow ? 4.55 : 3.65,
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

    if (reducedMotion) {
      camera.position.copy(base.current);
      camera.lookAt(0, 0.1, 0);
      return;
    }

    const t = clock.elapsedTime;
    const s = heroScroll.eased;

    if (variant === "atmosphere") {
      camera.position.set(pointerState.x * 0.22, -pointerState.y * 0.16, base.current.z - s * 0.5);
      camera.lookAt(0, 0, 0);
      return;
    }

    camera.position.set(
      pointerState.x * 0.34 + Math.sin(t * 0.14) * 0.035,
      base.current.y + pointerState.y * 0.17 + s * 0.95 + Math.sin(t * 0.2) * 0.022,
      base.current.z - s * 1.05,
    );
    camera.lookAt(0, 0.1 + s * 0.22, 0);
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

  const fov = variant === "atmosphere" ? 42 : 34;

  return (
    <Canvas
      dpr={dpr}
      frameloop={active && !reducedMotion ? "always" : "demand"}
      camera={{ fov, position: [0, 1.52, 3.65], near: 0.1, far: 40 }}
      gl={{
        antialias: quality !== "low",
        alpha: true,
        powerPreference: "high-performance",
        stencil: false,
        depth: true,
      }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        gl.outputColorSpace = THREE.SRGBColorSpace;
      }}
      style={{ position: "absolute", inset: 0, background: "transparent" }}
      data-testid="hero-canvas"
    >
      <PerspectiveCamera makeDefault fov={fov} position={[0, 1.52, 3.65]} />
      <Suspense fallback={null}>
        {variant === "plated" ? (
          <PlatedDish
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
