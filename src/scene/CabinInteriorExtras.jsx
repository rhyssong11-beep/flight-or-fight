import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { fuselageWallZ } from './airframeGeometry';

const WINDOW_GLASS_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const WINDOW_GLASS_FRAG = /* glsl */ `
  varying vec2 vUv;
  uniform float uDim;
  uniform float uFrost;
  uniform float uTime;
  uniform float uNight;

  float hash(vec2 p) {
    p = fract(p * vec2(234.34, 435.345));
    p += dot(p, p + 34.23);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  float crystal(vec2 uv) {
    float n = 0.0;
    float amp = 0.52;
    mat2 rot = mat2(0.8, -0.6, 0.6, 0.8);
    vec2 p = uv * 24.0;
    for (int i = 0; i < 5; i++) {
      float v = abs(noise(p) * 2.0 - 1.0);
      n += (1.0 - v) * amp;
      p = rot * p * 2.07 + vec2(3.7, 1.9);
      amp *= 0.52;
    }
    return n;
  }

  void main() {
    // Rounded aircraft window oval mask
    vec2 q = (vUv - 0.5) * 2.0;
    float oval = length(vec2(q.x * 1.06, q.y * 0.98));
    if (oval > 1.04) discard;

    // 1) Electrochromic tint (Boeing 787 / luxury suite blue-indigo glass darkening)
    vec3 tintCol = mix(vec3(0.06, 0.14, 0.28), vec3(0.02, 0.04, 0.11), uDim);
    float tintAlpha = uDim * 0.91;

    // Subtle glass specular reflection
    float sheen = smoothstep(0.35, 0.95, 1.0 - abs(vUv.x - vUv.y * 0.65 - 0.15)) * 0.065;

    // 2) -54°C high-altitude ice crystal frost creeping inward from window perimeter
    float edgeDist = smoothstep(0.46, 0.98, oval);
    float cPattern = crystal(vUv + vec2(0.0, 0.02));
    float frostMask = smoothstep(0.55, 1.18, edgeDist * 1.15 + cPattern * 0.52) * uFrost;
    float sparkle = pow(noise(vUv * 85.0 + uTime * 0.15), 5.0) * frostMask * 0.7;

    vec3 frostCol = mix(vec3(0.92, 0.96, 1.0), vec3(0.68, 0.80, 0.95), uNight * 0.75) + sparkle;

    vec3 col = mix(tintCol + sheen, frostCol, clamp(frostMask * 1.1, 0.0, 1.0));
    float alpha = max(tintAlpha + sheen, frostMask * 0.84);

    if (alpha < 0.008) discard;
    gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.97));
  }
`;

function buildCurvedWindowPaneGeo(sideSign, width = 0.66, height = 0.80, yCenter = 1.30, inset = 0.055) {
  const segX = 4;
  const segY = 12;
  const pos = [];
  const uvs = [];
  const idx = [];
  for (let iy = 0; iy <= segY; iy++) {
    const v = iy / segY;
    const y = yCenter - height / 2 + v * height;
    const z = sideSign * (fuselageWallZ(y) - inset);
    for (let ix = 0; ix <= segX; ix++) {
      const u = ix / segX;
      const x = (u - 0.5) * width;
      pos.push(x, y, z);
      uvs.push(u, v);
      if (iy < segY && ix < segX) {
        const a = iy * (segX + 1) + ix;
        const b = a + segX + 1;
        idx.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Interior ceiling dome + Emirates-style Starry Ceiling + Mood Lighting
 */
export function CabinCeilingAndMood({ env, seatbeltOn }) {
  const groupRef = useRef(null);
  const stripLeftRef = useRef(null);
  const stripRightRef = useRef(null);
  const starsMatRef = useRef(null);
  const ceilingMatRef = useRef(null);

  const ceilingGeo = useMemo(() => {
    const pos = [];
    const idx = [];
    for (let i = 0; i <= 32; i++) {
      const a = (i / 32) * Math.PI;
      const y = 1.97 + Math.sin(a) * 0.98;
      const z = Math.cos(a) * 3.1;
      pos.push(-21.52, y, z, 21.96, y, z);
      if (i < 32) {
        const v = i * 2;
        idx.push(v, v + 1, v + 2, v + 2, v + 1, v + 3);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Starry Ceiling fiber-optic points along cabin arch (signature night luxury effect!)
  const starPointsGeo = useMemo(() => {
    const count = 420;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    let seed = 1337;
    const rand = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    for (let i = 0; i < count; i++) {
      const x = -21.0 + rand() * 42.0;
      const a = 0.22 * Math.PI + rand() * 0.56 * Math.PI;
      const y = 1.94 + Math.sin(a) * 0.95;
      const z = Math.cos(a) * 3.04;
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
      // Warm champagne + crisp star white mix
      const warm = rand() > 0.35;
      col[i * 3] = warm ? 1.0 : 0.85;
      col[i * 3 + 1] = warm ? 0.93 : 0.92;
      col[i * 3 + 2] = warm ? 0.78 : 1.0;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return geo;
  }, []);

  useEffect(
    () => () => {
      ceilingGeo.dispose();
      starPointsGeo.dispose();
    },
    [ceilingGeo, starPointsGeo]
  );

  const dayLed = useMemo(() => new THREE.Color('#f5dfb4'), []);
  const nightLed = useMemo(() => new THREE.Color('#8e9bff'), []);
  const auroraLed = useMemo(() => new THREE.Color('#6fe3c1'), []);
  const alertLed = useMemo(() => new THREE.Color('#ffb76b'), []);
  const tmpCol = useMemo(() => new THREE.Color(), []);

  useFrame(({ camera, clock }) => {
    if (!groupRef.current) return;
    groupRef.current.visible = camera.position.y < 2.85;

    // Dynamic mood lighting color
    tmpCol.copy(dayLed).lerp(nightLed, env.nightFactor * 0.85);
    if (env.auroraFactor > 0.25) {
      tmpCol.lerp(auroraLed, env.auroraFactor * 0.45);
    }
    if (seatbeltOn) {
      const pulse = 0.5 + 0.5 * Math.sin(clock.elapsedTime * 4.5);
      tmpCol.lerp(alertLed, 0.35 * pulse);
    }
    if (stripLeftRef.current) stripLeftRef.current.color.copy(tmpCol);
    if (stripRightRef.current) stripRightRef.current.color.copy(tmpCol);

    if (ceilingMatRef.current) {
      ceilingMatRef.current.color.set('#ad9b86').lerp(new THREE.Color('#34394a'), env.nightFactor * 0.72);
    }
    if (starsMatRef.current) {
      const twinkle = 0.82 + 0.18 * Math.sin(clock.elapsedTime * 1.8);
      starsMatRef.current.opacity = Math.max(0, (env.nightFactor - 0.15) * 1.15) * twinkle;
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      <mesh geometry={ceilingGeo}>
        <meshStandardMaterial ref={ceilingMatRef} color="#ad9b86" side={THREE.DoubleSide} roughness={0.85} />
      </mesh>
      <mesh position={[0.22, 2.32, -2.87]}>
        <boxGeometry args={[43.44, 0.032, 0.048]} />
        <meshBasicMaterial ref={stripLeftRef} color="#f5dfb4" />
      </mesh>
      <mesh position={[0.22, 2.32, 2.87]}>
        <boxGeometry args={[43.44, 0.032, 0.048]} />
        <meshBasicMaterial ref={stripRightRef} color="#f5dfb4" />
      </mesh>
      {/* Overhead Emirates-style Starry Ceiling fiber optics */}
      <points geometry={starPointsGeo}>
        <pointsMaterial
          ref={starsMatRef}
          size={0.055}
          vertexColors
          transparent
          opacity={0}
          depthWrite={false}
          sizeAttenuation
        />
      </points>
    </group>
  );
}

/**
 * Interactive 3D Window Dimmer, Physical Shutter Blind & -54°C Frost Shader
 * Rendered around the currently occupied seat's adjacent cabin windows.
 */
export function InteractiveWindowSet({ seat, dimLevel, shutterPos, frostEnabled, env }) {
  const shutterRefs = useRef([]);
  const glassMatRefs = useRef([]);
  const sunLightRef = useRef(null);

  const sideSign = seat ? (seat.z < 0 ? -1 : 1) : -1;

  // Build curved window panes for BOTH sides (-1 Port & +1 Starboard) so looking across to the opposite window renders seamlessly!
  const paneGeos = useMemo(
    () => ({
      leftGlass: buildCurvedWindowPaneGeo(-1, 0.67, 0.80, 1.30, 0.055),
      leftShutter: buildCurvedWindowPaneGeo(-1, 0.69, 0.82, 1.30, 0.095),
      rightGlass: buildCurvedWindowPaneGeo(1, 0.67, 0.80, 1.30, 0.055),
      rightShutter: buildCurvedWindowPaneGeo(1, 0.69, 0.82, 1.30, 0.095),
    }),
    []
  );

  const initialGlassUniforms = useMemo(
    () => ({
      uDim: { value: 0 },
      uFrost: { value: 0 },
      uTime: { value: 0 },
      uNight: { value: 0 },
    }),
    []
  );

  useEffect(
    () => () => {
      paneGeos.leftGlass.dispose();
      paneGeos.leftShutter.dispose();
      paneGeos.rightGlass.dispose();
      paneGeos.rightShutter.dispose();
    },
    [paneGeos]
  );

  // Target 5 nearby windows along both cabin walls so sweeping 360° from one window to the opposite side is seamless
  const windowPositions = useMemo(() => {
    if (!seat) return [];
    const indices = [
      seat.windowIndex - 2,
      seat.windowIndex - 1,
      seat.windowIndex,
      seat.windowIndex + 1,
      seat.windowIndex + 2,
    ].filter((i) => i >= 0 && i <= 41);
    return indices.map((i) => -21 + i * 1.035);
  }, [seat]);

  const smoothShutter = useRef(0);
  const smoothDim = useRef(0);
  const smoothFrost = useRef(0);
  const smoothNight = useRef(0);

  useFrame(({ clock }, delta) => {
    const k = 1 - Math.exp(-Math.min(delta, 0.1) * 9);
    const targetDim = dimLevel / 4;
    const targetFrost = frostEnabled ? 1.0 : 0.0;

    smoothDim.current += (targetDim - smoothDim.current) * k;
    smoothFrost.current += (targetFrost - smoothFrost.current) * k;
    smoothNight.current += (env.nightFactor - smoothNight.current) * k;

    glassMatRefs.current.forEach((mat) => {
      if (!mat?.uniforms) return;
      mat.uniforms.uDim.value = smoothDim.current;
      mat.uniforms.uFrost.value = smoothFrost.current;
      mat.uniforms.uTime.value = clock.elapsedTime;
      mat.uniforms.uNight.value = smoothNight.current;
    });

    smoothShutter.current += (shutterPos - smoothShutter.current) * k;
    const s = smoothShutter.current;
    shutterRefs.current.forEach((mesh) => {
      if (!mesh) return;
      mesh.visible = s > 0.01;
      mesh.scale.set(1, Math.max(0.001, s), 1);
      mesh.position.y = 1.71 * (1 - s);
    });

    if (sunLightRef.current) {
      const transmission = (1 - s * 0.92) * (1 - targetDim * 0.78) * (1 - env.nightFactor * 0.85);
      sunLightRef.current.intensity = Math.max(0, transmission * 1.9);
    }
  });

  if (!seat) return null;

  return (
    <group>
      {windowPositions.map((wx, wIdx) =>
        [-1, 1].map((s, sIdx) => {
          const refIdx = wIdx * 2 + sIdx;
          const gGeo = s < 0 ? paneGeos.leftGlass : paneGeos.rightGlass;
          const shGeo = s < 0 ? paneGeos.leftShutter : paneGeos.rightShutter;
          return (
            <group key={`${wx}-${s}`} position={[wx, 0, 0]}>
              <mesh geometry={gGeo} renderOrder={4}>
                <shaderMaterial
                  ref={(el) => {
                    glassMatRefs.current[refIdx] = el;
                  }}
                  vertexShader={WINDOW_GLASS_VERT}
                  fragmentShader={WINDOW_GLASS_FRAG}
                  uniforms={initialGlassUniforms}
                  transparent
                  depthWrite={false}
                  side={THREE.DoubleSide}
                />
              </mesh>
              <mesh
                ref={(el) => {
                  shutterRefs.current[refIdx] = el;
                }}
                geometry={shGeo}
                visible={false}
                renderOrder={5}
              >
                <meshStandardMaterial color="#e7dcc8" roughness={0.62} metalness={0.05} side={THREE.DoubleSide} />
              </mesh>
            </group>
          );
        })
      )}
      <pointLight
        ref={sunLightRef}
        position={[seat.windowX, 1.32, sideSign * 2.75]}
        color={env.nightFactor > 0.5 ? '#6ba6ff' : '#ffe4be'}
        intensity={1.4}
        distance={5.2}
        decay={2}
      />
    </group>
  );
}

/**
 * 3D Legroom Dimension Ruler rendered in front of the selected seat when measuring pitch!
 */
export function LegroomRuler3D({ seat, heightCm, visible }) {
  const matRef = useRef(null);
  const pulseRef = useRef(null);

  useFrame(({ clock }) => {
    if (!visible || !matRef.current) return;
    const p = 0.72 + 0.28 * Math.sin(clock.elapsedTime * 3.5);
    matRef.current.opacity = p;
    if (pulseRef.current) pulseRef.current.opacity = p * 0.45;
  });

  if (!seat || !visible) return null;

  // Approximate seat pitch in Three.js world meters
  const pitchMeters = seat.pitchInches * 0.0254;
  const kneeReach = Math.min(pitchMeters - 0.12, (heightCm / 175) * 0.58);
  const clearanceM = Math.max(0.06, pitchMeters - kneeReach - 0.16);
  const startX = seat.x - 0.22;
  const endX = startX - clearanceM;
  const midX = (startX + endX) / 2;
  const color = clearanceM < 0.14 ? '#e87a48' : clearanceM < 0.28 ? '#d6a954' : '#58c48d';

  return (
    <group position={[0, 0.46, seat.z]}>
      {/* Main dimension line */}
      <mesh position={[midX, 0, 0]}>
        <boxGeometry args={[clearanceM, 0.018, 0.018]} />
        <meshBasicMaterial ref={matRef} color={color} transparent opacity={0.9} depthTest={false} />
      </mesh>
      {/* Front & back end-ticks */}
      <mesh position={[startX, 0, 0]}>
        <boxGeometry args={[0.018, 0.14, 0.22]} />
        <meshBasicMaterial color={color} transparent opacity={0.85} depthTest={false} />
      </mesh>
      <mesh position={[endX, 0, 0]}>
        <boxGeometry args={[0.018, 0.14, 0.22]} />
        <meshBasicMaterial color={color} transparent opacity={0.85} depthTest={false} />
      </mesh>
      {/* Translucent floor zone highlight showing legroom footprint */}
      <mesh position={[midX, -0.43, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[clearanceM, 0.46]} />
        <meshBasicMaterial ref={pulseRef} color={color} transparent opacity={0.32} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/**
 * 3D Sun-Side & Aurora Direction Beacon around aircraft in Overview / Class view
 * Clearly visualizes which side of the aircraft (A-side Port vs K-side Starboard) receives sunlight!
 */
export function SunDirectionBeacon({ env, active }) {
  const groupRef = useRef(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    groupRef.current.visible = active;
    if (!active) return;
    const pulse = 1 + 0.08 * Math.sin(clock.elapsedTime * 2.8);
    groupRef.current.scale.setScalar(pulse);
  });

  if (!active) return null;

  const isAurora = env.sunSide === 'aurora';
  const sideSign = env.sunSide === 'port' ? -1 : 1;
  const beaconColor = isAurora ? '#48e6b4' : '#f7c56b';

  return (
    <group ref={groupRef} position={[0, 2.2, isAurora ? 0 : sideSign * 14.5]}>
      {isAurora ? (
        // Aurora glow bands along both windows
        [-1, 1].map((s) => (
          <mesh key={s} position={[0, 0, s * 7.8]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[36, 1.3]} />
            <meshBasicMaterial color="#48e6b4" transparent opacity={0.32} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
        ))
      ) : (
        <group>
          {/* Glowing solar orb indicator on sun-facing side */}
          <mesh>
            <sphereGeometry args={[1.05, 20, 20]} />
            <meshBasicMaterial color={beaconColor} transparent opacity={0.9} />
          </mesh>
          {/* Concentric solar halo */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.45, 2.15, 32]} />
            <meshBasicMaterial color={beaconColor} transparent opacity={0.42} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
          {/* Three golden light rays pointing toward the sun-side fuselage */}
          {[-7, 0, 7].map((ox) => (
            <mesh key={ox} position={[ox, 0, -sideSign * 5.2]} rotation={[0, 0, 0]}>
              <boxGeometry args={[0.18, 0.08, 6.2]} />
              <meshBasicMaterial color={beaconColor} transparent opacity={0.5} depthWrite={false} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}
