import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function generateCloudField(size = 512) {
  let seed = 497781;
  const rand = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const noise = new Float32Array(256 * 256);
  for (let i = 0; i < noise.length; i++) noise[i] = rand();

  const sampleNoise = (x, y, freq) => {
    const fx = x * freq;
    const fy = y * freq;
    const ix = Math.floor(fx);
    const iy = Math.floor(fy);
    const mask = freq - 1;
    const tx = fx - ix;
    const ty = fy - iy;
    const sx = tx * tx * (3 - 2 * tx);
    const sy = ty * ty * (3 - 2 * ty);
    const n00 = noise[(ix & mask) + ((iy & mask) << 8)];
    const n10 = noise[((ix + 1) & mask) + ((iy & mask) << 8)];
    const n01 = noise[(ix & mask) + (((iy + 1) & mask) << 8)];
    const n11 = noise[((ix + 1) & mask) + (((iy + 1) & mask) << 8)];
    return n00 + (n10 - n00) * sx + ((n01 - n00) * (1 - sx) + (n11 - n10) * sx) * sy;
  };

  const height = new Float32Array(size * size);
  const puff = new Float32Array(size * size);
  const mask = size - 1;

  const stamp = (cx, cy, rx, ry, amp, base) => {
    const gx = cx * size;
    const gy = cy * size;
    const rpx = rx * size;
    const rpy = ry * size;
    for (let y = Math.floor(gy - rpy); y <= gy + rpy; y++) {
      const dy = (y - gy) / rpy;
      for (let x = Math.floor(gx - rpx); x <= gx + rpx; x++) {
        const dx = (x - gx) / rpx;
        const d2 = dx * dx + dy * dy;
        if (d2 > 1) continue;
        const val = (amp * Math.sqrt(1 - d2) + base) * Math.min(1, (1 - d2) * 5);
        const idx = (x & mask) + (y & mask) * size;
        puff[idx] = Math.max(puff[idx], val);
      }
    }
  };

  for (let c = 0; c < 23; c++) {
    const cx = rand();
    const cy = rand();
    const rad = 0.045 + rand() * 0.126;
    for (let k = 0; k < 6; k++) {
      const rx = rad * (0.2 + rand() * 0.6);
      const ry = rx * (0.64 + rand() * 0.4);
      const px = cx + (rand() - 0.5) * rad * 2.5;
      const py = cy + (rand() - 0.5) * rad * 1.3;
      const amp = (rx * 2.8 + 0.1) * (0.9 + rand() * 0.5);
      stamp(px, py, rx, ry, amp, 0);
      for (let b = 0; b < 22; b++) {
        const a = rand() * Math.PI * 2;
        const dist = Math.sqrt(rand()) * 0.94;
        const sr = rx * (0.055 + rand() * 0.3);
        stamp(
          px + Math.cos(a) * dist * rx,
          py + Math.sin(a) * dist * ry,
          sr,
          sr * (0.74 + rand() * 0.3),
          sr * 2.3,
          amp * Math.sqrt(1 - dist * dist) * 0.965
        );
      }
    }
  }

  const getPuff = (x, y) => puff[(x & mask) + (y & mask) * size];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;
      const wu = u + 0.051 * sampleNoise(u, v, 8) + 0.019 * sampleNoise(u + 0.34, v, 32) + 0.005 * sampleNoise(u, v, 128);
      const wv = v + 0.049 * sampleNoise(u + 0.62, v, 8) + 0.019 * sampleNoise(u, v + 0.24, 32) + 0.005 * sampleNoise(u + 0.3, v, 128);
      const ix = Math.floor(wu * size);
      const iy = Math.floor(wv * size);
      const fx = wu * size - ix;
      const fy = wv * size - iy;
      const p0 = getPuff(ix, iy) * (1 - fx) + getPuff(ix + 1, iy) * fx;
      const p1 = getPuff(ix, iy + 1) * (1 - fx) + getPuff(ix + 1, iy + 1) * fx;
      const baseP = p0 * (1 - fy) + p1 * fy;
      const ridge = (f) => 1 - Math.abs(sampleNoise(wu + 0.183, wv + 0.223, f) * 2 - 1);
      const fbm =
        0.16 * sampleNoise(wu, wv, 8) +
        0.122 * sampleNoise(wu + 0.81, wv + 0.49, 16) +
        0.063 * sampleNoise(wu + 0.17, wv, 32);
      const detail = ridge(32) * 0.022 + ridge(64) * 0.017 + ridge(128) * 0.01 + sampleNoise(wu, wv, 128) * 0.008;
      height[x + y * size] = fbm + baseP + detail;
    }
  }

  const getH = (x, y) => height[(x & mask) + (y & mask) * size];
  const rgba = new Uint8Array(size * size * 4);
  const cShadow = [147, 145, 156];
  const cMid = [214, 189, 168];
  const cLit = [254, 231, 199];
  const steps = [2, 5, 9, 16, 25, 39, 58];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const h0 = getH(x, y);
      let occ = 0;
      for (const s of steps) {
        const sx = x - s;
        const sy = y - Math.round(s * 0.62);
        const side = Math.round(s * 0.16);
        const sh = 0.5 * getH(sx, sy) + 0.25 * (getH(sx + side, sy - side) + getH(sx - side, sy + side));
        occ += Math.min(1, Math.max(0, (sh - h0 - s * 0.002 + 0.02) * 10));
      }
      const slope =
        0.52 * (getH(x + 2, y + 1) - getH(x - 2, y - 1)) +
        0.48 * (getH(x + 6, y + 4) - getH(x - 6, y - 4));
      const lit = Math.min(1, Math.max(0, 0.02 + h0 * 0.89 + 0.41 * Math.exp(-occ * 0.5) + slope * 1.55));
      const idx = (x + y * size) * 4;
      const from = lit < 0.49 ? cShadow : cMid;
      const to = lit < 0.49 ? cMid : cLit;
      const t = lit < 0.49 ? lit / 0.49 : (lit - 0.49) / 0.51;
      for (let k = 0; k < 3; k++) rgba[idx + k] = from[k] + (to[k] - from[k]) * t;
      rgba[idx + 3] = Math.min(255, h0 * 255);
    }
  }
  return rgba;
}

const VERT_SHADER = /* glsl */ `
  varying vec2 vNdc;
  void main() {
    vNdc = position.xy;
    gl_Position = vec4(position.xy, 0.99999, 1.0);
  }
`;

const FRAG_SHADER = /* glsl */ `
  varying vec2 vNdc;
  uniform mat4 uInvProjection;
  uniform mat4 uCamWorld;
  uniform sampler2D cloudField;
  uniform float elapsed;
  uniform vec3 uSunDir;
  uniform float uNight;
  uniform float uDay;
  uniform float uAurora;
  uniform float uStorm;
  uniform float uLightning;

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * vnoise(p);
      p *= 2.03;
      a *= 0.5;
    }
    return v;
  }

  // Procedural starfield for Arctic night sky
  float stars(vec3 dir, float t) {
    vec2 uv = vec2(atan(dir.z, dir.x), asin(clamp(dir.y, -1.0, 1.0))) * 78.0;
    vec2 cell = floor(uv);
    vec2 f = fract(uv) - 0.5;
    float h = hash21(cell);
    if (h < 0.968) return 0.0;
    vec2 jitter = (vec2(hash21(cell + 19.1), hash21(cell + 71.7)) - 0.5) * 0.6;
    float d = length(f - jitter);
    float twinkle = 0.65 + 0.35 * sin(t * (2.0 + h * 4.5) + h * 40.0);
    return smoothstep(0.11, 0.01, d) * twinkle * smoothstep(0.02, 0.25, dir.y);
  }

  // Shimmering Arctic Aurora Borealis curtains (tuned to look breathtaking both from overview and window-level horizon!)
  vec3 aurora(vec3 dir, float t) {
    if (dir.y <= -0.02) return vec3(0.0);
    float elev = max(0.01, dir.y);
    vec2 p = dir.xz / (elev + 0.34);
    float wave1 = fbm(vec2(p.x * 0.65 + t * 0.055, p.y * 0.42 - t * 0.03));
    float ribbon1 = exp(-pow(abs(p.y * 0.46 + sin(p.x * 1.1 + t * 0.22) * 0.48 + (wave1 - 0.5) * 0.9) * 3.4, 1.5));
    float wave2 = fbm(vec2(p.x * 1.05 - t * 0.06 + 4.2, p.y * 0.55 + t * 0.035));
    float ribbon2 = exp(-pow(abs(p.y * 0.36 - 0.35 + cos(p.x * 0.9 - t * 0.17) * 0.52 + (wave2 - 0.5) * 0.95) * 3.2, 1.45));
    // Secondary horizon curtain so 1st-person window views see vivid sweeping ribbons right above the wing!
    float horizonRibbon = exp(-pow((dir.y - 0.14 - 0.06 * sin(atan(dir.z, dir.x) * 3.0 + t * 0.35) - (wave1 - 0.5) * 0.14) * 9.5, 2.0));

    float rays = 0.62 + 0.38 * sin(p.x * 13.0 + wave1 * 10.0 + t * 0.9);
    float altMask = smoothstep(-0.01, 0.09, dir.y) * smoothstep(0.94, 0.24, dir.y);

    vec3 emerald = vec3(0.14, 0.98, 0.66);
    vec3 cyan = vec3(0.15, 0.78, 0.98);
    vec3 violet = vec3(0.60, 0.28, 0.98);

    vec3 col1 = mix(emerald, cyan, smoothstep(0.08, 0.42, dir.y));
    vec3 col2 = mix(cyan, violet, smoothstep(0.12, 0.52, dir.y));
    return (col1 * (ribbon1 + horizonRibbon * 0.85) + col2 * ribbon2 * 0.8) * rays * altMask;
  }

  void main() {
    vec3 viewRay = (uInvProjection * vec4(vNdc, 1.0, 1.0)).xyz;
    vec3 ray = normalize(mat3(uCamWorld) * viewRay);
    vec3 eye = uCamWorld[3].xyz;
    vec3 sun = normalize(uSunDir);
    float facingSun = max(0.0, dot(ray, sun));
    float elevation = clamp(ray.y, 0.0, 1.0);

    // 1) Golden Hour palette (original Aeris default)
    vec3 horizonGolden = mix(vec3(0.86, 0.77, 0.73), vec3(1.0, 0.84, 0.65), pow(facingSun, 3.0));
    vec3 zenithGolden = vec3(0.49, 0.63, 0.73);

    // 2) Stratosphere Noon palette
    vec3 horizonDay = mix(vec3(0.76, 0.86, 0.95), vec3(0.96, 0.97, 1.0), pow(facingSun, 3.0));
    vec3 zenithDay = vec3(0.17, 0.42, 0.74);

    // 3) Polar Night palette
    vec3 horizonNight = vec3(0.07, 0.11, 0.19);
    vec3 zenithNight = vec3(0.018, 0.028, 0.068);

    vec3 horizon = mix(horizonGolden, horizonDay, uDay);
    horizon = mix(horizon, horizonNight, uNight);

    vec3 zenith = mix(zenithGolden, zenithDay, uDay);
    zenith = mix(zenith, zenithNight, uNight);

    // Storm darkening
    vec3 stormSkyH = mix(vec3(0.30, 0.34, 0.40), vec3(0.06, 0.08, 0.12), uNight);
    vec3 stormSkyZ = mix(vec3(0.16, 0.20, 0.26), vec3(0.02, 0.03, 0.05), uNight);
    horizon = mix(horizon, stormSkyH, uStorm * 0.72);
    zenith = mix(zenith, stormSkyZ, uStorm * 0.72);

    vec3 sky = mix(horizon, zenith, smoothstep(0.0, 0.87, elevation));

    // Sun glow & solar disc (attenuated at night or storm)
    float sunVis = (1.0 - uNight * 0.95) * (1.0 - uStorm * 0.75);
    vec3 sunGlowColor = mix(vec3(0.09, 0.071, 0.035), vec3(0.08, 0.09, 0.11), uDay);
    sky += sunGlowColor * pow(facingSun, 16.0) * sunVis;
    sky = mix(sky, vec3(1.0, 0.966, 0.85), smoothstep(0.9981, 0.9998, facingSun) * sunVis);

    // Night stars & Arctic Aurora
    if (uNight > 0.04) {
      float starMask = uNight * (1.0 - uStorm * 0.82);
      sky += vec3(0.92, 0.95, 1.0) * stars(ray, elapsed) * starMask;
    }
    if (uAurora > 0.02) {
      vec3 aur = aurora(ray, elapsed);
      sky += aur * uAurora * (1.0 - uStorm * 0.65) * 0.95;
    }

    // Cloud deck with dual-sample parallax relief
    float downward = max(0.015, -ray.y);
    float speedMult = 1.0 + uStorm * 1.45;
    vec2 drift = vec2(-elapsed * 0.0017 * speedMult, elapsed * 0.00016 * speedMult);
    float distanceToDeck = max(0.0, eye.y + 67.0) / downward;
    vec2 uv = (eye.xz + ray.xz * distanceToDeck) / 186.0 + vec2(0.38, 0.64) + drift;
    float h = texture2D(cloudField, uv).a;
    vec2 relief = ray.xz * (6.2 / 186.0) / max(0.28, downward);
    vec4 cloud = texture2D(cloudField, uv - relief * h);
    vec4 mist = texture2D(cloudField, uv * 1.7 + vec2(0.47, 0.19) + drift * 0.27);

    // Re-tint original golden-baked cloud deck across Day / Night / Storm
    vec3 deck = cloud.rgb;
    float lum = dot(deck, vec3(0.299, 0.587, 0.114));

    // Noon crisp white cumulus
    vec3 dayDeck = mix(vec3(0.60, 0.70, 0.82), vec3(0.98, 0.99, 1.0), smoothstep(0.48, 0.95, lum));
    deck = mix(deck, dayDeck, uDay);

    // Polar night moonlit + subtle aurora-reflected cloud tops
    vec3 nightDeck = mix(vec3(0.05, 0.075, 0.13), vec3(0.18, 0.25, 0.36), smoothstep(0.42, 0.95, lum));
    nightDeck += vec3(0.03, 0.16, 0.12) * uAurora * smoothstep(0.5, 0.95, lum);
    deck = mix(deck, nightDeck, uNight);

    // Storm thunderhead darkening
    vec3 stormDeck = mix(vec3(0.10, 0.12, 0.16), vec3(0.32, 0.35, 0.42), smoothstep(0.45, 0.96, lum));
    stormDeck *= mix(1.0, 0.38, uNight);
    deck = mix(deck, stormDeck, uStorm * 0.78);

    float wisps = smoothstep(0.31, 0.69, mist.a) * (1.0 - smoothstep(0.24, 0.52, cloud.a));
    vec3 wispCol = mix(mix(vec3(0.90, 0.83, 0.78), vec3(0.92, 0.95, 0.99), uDay), vec3(0.12, 0.18, 0.26), uNight);
    deck = mix(deck, wispCol, wisps * 0.26);

    float sunward = dot(ray.xz, sun.xz);
    deck += vec3(0.038, 0.010, -0.018) * (0.5 + sunward * 0.5) * sunVis;

    // Storm lightning illumination pulsing inside cloud crevices
    if (uLightning > 0.01) {
      float flashMask = smoothstep(0.35, 0.88, mist.a) * (0.4 + 0.6 * smoothstep(0.4, 0.9, h));
      vec3 boltCol = vec3(0.76, 0.86, 1.0) * uLightning;
      deck += boltCol * (0.45 + 1.25 * flashMask);
      sky += boltCol * 0.26 * (1.0 - elevation);
    }

    float haze = clamp(distanceToDeck / 2800.0, 0.035, 0.85);
    deck = mix(deck, horizon, haze);
    vec3 color = mix(sky, deck, smoothstep(0.015, 0.15, -ray.y));
    gl_FragColor = vec4(color, 1.0);
  }
`;

export default function SkyAndClouds({ env, stormLevel = 0, lightningRef }) {
  const matRef = useRef(null);
  const targetSun = useMemo(() => new THREE.Vector3(), []);

  const initialUniforms = useMemo(() => {
    const tex = new THREE.DataTexture(generateCloudField(512), 512, 512, THREE.RGBAFormat);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.generateMipmaps = true;
    tex.needsUpdate = true;
    return {
      cloudField: { value: tex },
      elapsed: { value: 0 },
      uCamWorld: { value: new THREE.Matrix4() },
      uInvProjection: { value: new THREE.Matrix4() },
      uSunDir: { value: new THREE.Vector3(-0.75, 0.19, -0.48) },
      uNight: { value: 0 },
      uDay: { value: 0 },
      uAurora: { value: 0 },
      uStorm: { value: 0 },
      uLightning: { value: 0 },
    };
  }, []);

  useEffect(() => () => initialUniforms.cloudField.value.dispose(), [initialUniforms]);

  useFrame(({ camera, clock }, delta) => {
    const mat = matRef.current;
    if (!mat) return;
    const u = mat.uniforms;

    camera.updateMatrixWorld();
    u.uCamWorld.value.copy(camera.matrixWorld);
    u.uInvProjection.value.copy(camera.projectionMatrixInverse);
    u.elapsed.value = clock.elapsedTime;

    const k = 1 - Math.exp(-Math.min(delta, 0.1) * 7.5);
    targetSun.set(env.sunDir[0], env.sunDir[1], env.sunDir[2]);
    u.uSunDir.value.lerp(targetSun, k);
    u.uNight.value += (env.nightFactor - u.uNight.value) * k;
    u.uDay.value += (env.daylightFactor - u.uDay.value) * k;
    u.uAurora.value += (env.auroraFactor - u.uAurora.value) * k;
    u.uStorm.value += (stormLevel - u.uStorm.value) * k;
    u.uLightning.value = lightningRef?.current || 0;
  });

  return (
    <mesh frustumCulled={false} renderOrder={-100} raycast={() => {}}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={VERT_SHADER}
        fragmentShader={FRAG_SHADER}
        uniforms={initialUniforms}
        depthTest={false}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}
