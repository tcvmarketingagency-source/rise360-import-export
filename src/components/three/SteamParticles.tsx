"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { getMoteTexture, getSteamTexture } from "@/lib/three/textures";

/**
 * GPU-animated particle field — one draw call, no per-frame JS allocation.
 * Used for both the steam column above the plate and the spice motes drifting
 * through the light.
 */

const vertexShader = /* glsl */ `
  attribute float aSeed;
  attribute float aSize;
  attribute float aSpeed;

  uniform float uTime;
  uniform float uRise;
  uniform float uSpread;
  uniform float uPixelRatio;
  uniform float uScale;
  uniform float uSway;

  varying float vLife;
  varying float vSeed;

  void main() {
    float life = fract(uTime * aSpeed + aSeed);

    vec3 transformed = position;
    transformed.y += life * uRise;
    transformed.x += sin(uTime * 0.55 + aSeed * 24.0) * uSway * life * uSpread;
    transformed.z += cos(uTime * 0.42 + aSeed * 18.0) * uSway * life * uSpread;

    vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);

    // Grow as they rise, then fade out at the top of the column.
    float growth = 1.0 + life * 2.6;
    gl_PointSize = aSize * growth * uPixelRatio * (uScale / max(0.001, -mvPosition.z));
    gl_Position = projectionMatrix * mvPosition;

    vLife = life;
    vSeed = aSeed;
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D uTexture;
  uniform vec3 uColor;
  uniform float uOpacity;

  varying float vLife;
  varying float vSeed;

  void main() {
    vec4 tex = texture2D(uTexture, gl_PointCoord);
    float fadeIn = smoothstep(0.0, 0.18, vLife);
    float fadeOut = 1.0 - smoothstep(0.55, 1.0, vLife);
    float alpha = tex.a * fadeIn * fadeOut * uOpacity;
    if (alpha < 0.002) discard;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

export interface SteamParticlesProps {
  count?: number;
  /** Base position of the emitter. */
  position?: [number, number, number];
  /** Emitter radius on the X/Z plane. */
  radius?: number;
  rise?: number;
  spread?: number;
  sway?: number;
  size?: number;
  speed?: number;
  opacity?: number;
  color?: string;
  pixelRatio?: number;
  kind?: "steam" | "mote";
}

export function SteamParticles({
  count = 90,
  position = [0, 0, 0],
  radius = 0.4,
  rise = 2.4,
  spread = 0.35,
  sway = 0.16,
  size = 26,
  speed = 0.055,
  opacity = 0.3,
  color = "#f4e8d6",
  pixelRatio = 1,
  kind = "steam",
}: SteamParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const sizes = new Float32Array(count);
    const speeds = new Float32Array(count);

    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * radius;
      positions[i * 3] = Math.cos(angle) * r;
      positions[i * 3 + 1] = Math.random() * 0.14;
      positions[i * 3 + 2] = Math.sin(angle) * r;
      seeds[i] = Math.random();
      sizes[i] = size * (0.6 + Math.random() * 0.9);
      speeds[i] = speed * (0.7 + Math.random() * 0.75);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));
    return geo;
  }, [count, radius, size, speed]);

  const texture = useMemo(() => (kind === "steam" ? getSteamTexture() : getMoteTexture()), [kind]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uRise: { value: rise },
      uSpread: { value: spread },
      uPixelRatio: { value: pixelRatio },
      uScale: { value: 320 },
      uSway: { value: sway },
      uTexture: { value: texture },
      uColor: { value: new THREE.Color(color) },
      uOpacity: { value: opacity },
    }),
    [rise, spread, pixelRatio, sway, texture, color, opacity],
  );

  useFrame((_, delta) => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.uTime!.value += Math.min(delta, 0.05);
  });

  return (
    <points ref={pointsRef} position={position} frustumCulled={false}>
      <primitive object={geometry} attach="geometry" />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={kind === "steam" ? THREE.NormalBlending : THREE.AdditiveBlending}
      />
    </points>
  );
}
