import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export const AIRFRAME_PALETTE = {
  porcelain: '#e6e3d9',
  panel: '#cfcfc7',
  edge: '#a9aaa5',
  aluminum: '#b7bab5',
  graphite: '#282c2c',
  glass: '#202c31',
  brass: '#bfa36b',
  ivory: '#ebddc6',
  carpet: '#665e55',
  suite: '#736257',
  runner: '#99826a',
  rubber: '#363934',
  walnut: '#7e593e',
  blade: '#77807d',
  black: '#181d20',
  red: '#ae4840',
  green: '#527b63',
};

export const CABIN_START_X = -21.5175;
export const CABIN_END_X = CABIN_START_X + 42 * 1.035;
export const FUSELAGE_RADIUS = 3.375;

const FUSELAGE_STATIONS = [
  [-31, 0.045, -0.65],
  [-30.8, 0.66, -0.59],
  [-30.3, 1.22, -0.49],
  [-29.6, 1.77, -0.36],
  [-28.4, 2.42, -0.23],
  [-26.8, 2.91, -0.12],
  [-25, 3.19, -0.04],
  [-23.8, 3.31, -0.01],
  [CABIN_START_X, FUSELAGE_RADIUS, 0],
  [CABIN_END_X, FUSELAGE_RADIUS, 0],
  [24, 3.13, 0.16],
  [26, 2.65, 0.53],
  [28, 1.91, 0.97],
  [29.6, 1.17, 1.25],
  [30.7, 0.47, 1.45],
  [31, 0.06, 1.5],
];

function sampleStation(x) {
  const idx = Math.max(1, FUSELAGE_STATIONS.findIndex((s) => s[0] >= x));
  const s0 = FUSELAGE_STATIONS[idx - 1];
  const s1 = FUSELAGE_STATIONS[idx];
  const t = THREE.MathUtils.clamp((x - s0[0]) / (s1[0] - s0[0]), 0, 1);
  return [THREE.MathUtils.lerp(s0[1], s1[1], t), THREE.MathUtils.lerp(s0[2], s1[2], t)];
}

const superCurve = (v) => Math.sign(v) * Math.pow(Math.abs(v), 0.62);

function fuselagePoint(x, theta, pad = 0) {
  const [r, yOff] = sampleStation(x);
  return [x, yOff + superCurve(Math.sin(theta)) * (r * 0.87 + pad), superCurve(Math.cos(theta)) * (r + pad)];
}

export function fuselageWallZ(y) {
  const ratio = Math.min(0.9999, Math.abs(y) / (FUSELAGE_RADIUS * 0.87));
  return FUSELAGE_RADIUS * Math.pow(Math.max(0, 1 - Math.pow(ratio, 2 / 0.62)), 0.62 / 2);
}

function buildParametricGrid(uSegs, vSegs, fn) {
  const pos = [];
  const idx = [];
  for (let i = 0; i <= uSegs; i++) {
    for (let j = 0; j <= vSegs; j++) {
      pos.push(...fn(i / uSegs, j / vSegs));
      if (i < uSegs && j < vSegs) {
        const a = i * (vSegs + 1) + j;
        const b = a + vSegs + 1;
        idx.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

function roundedRectPath(path, x, y, w, h, r) {
  path.moveTo(x + r, y);
  path.lineTo(x + w - r, y);
  path.quadraticCurveTo(x + w, y, x + w, y + r);
  path.lineTo(x + w, y + h - r);
  path.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  path.lineTo(x + r, y + h);
  path.quadraticCurveTo(x, y + h, x, y + h - r);
  path.lineTo(x, y + r);
  path.quadraticCurveTo(x, y, x + r, y);
  return path;
}

function buildWindowPanelGeo(sideSign, kind) {
  const shape = new THREE.Shape();
  const hole = new THREE.Path();
  if (kind === 'panel') {
    shape.moveTo(-0.5175, -0.018);
    shape.lineTo(0.5175, -0.018);
    shape.lineTo(0.5175, 1.99);
    shape.lineTo(-0.5175, 1.99);
    shape.closePath();
    roundedRectPath(hole, -0.388, 0.805, 0.776, 0.99, 0.25);
  } else if (kind === 'lip') {
    roundedRectPath(shape, -0.4, 0.795, 0.8, 1.01, 0.26);
    roundedRectPath(hole, -0.34, 0.895, 0.68, 0.81, 0.22);
  } else {
    roundedRectPath(shape, -0.35, 0.885, 0.7, 0.83, 0.23);
    roundedRectPath(hole, -0.322, 0.913, 0.644, 0.774, 0.21);
  }
  shape.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: kind === 'panel' ? 0.085 : 0.11,
    bevelEnabled: false,
    curveSegments: 8,
  });
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    pos.setZ(i, sideSign * (fuselageWallZ(y) - pos.getZ(i) - (kind === 'panel' ? 0 : 0.018)));
  }
  geo.computeVertexNormals();
  return geo;
}

function createWalnutTexture(geo) {
  const data = new Uint8Array(128 * 96 * 4);
  const tau = Math.PI * 2;
  for (let y = 0; y < 96; y++) {
    for (let x = 0; x < 128; x++) {
      const u = x / 128;
      const v = y / 96;
      const wave = 0.023 * Math.sin(tau * u) + 0.012 * Math.sin(tau * (u * 2 + v));
      const g1 = Math.sin(tau * (v + wave) * 9);
      const g2 = Math.sin(tau * (v + wave) * 34);
      const shade = 1 + 0.12 * g1 + 0.05 * g2;
      data.set([133 * shade, 94 * shade, 66 * shade, 255], (y * 128 + x) * 4);
    }
  }
  const tex = new THREE.DataTexture(data, 128, 96);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;

  const pos = geo.attributes.position;
  const norm = geo.attributes.normal;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = (Math.abs(norm.getX(i)) > 0.5 ? pos.getZ(i) : pos.getX(i)) * 0.46;
    uv[i * 2 + 1] = (Math.abs(norm.getY(i)) > 0.5 ? pos.getZ(i) : pos.getY(i)) * 0.94;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return tex;
}

function makeBucketCollector() {
  const buckets = new Map();
  const push = (matKey, rawGeo) => {
    let g = rawGeo;
    if (rawGeo.index) {
      g = rawGeo.toNonIndexed();
      rawGeo.dispose();
    }
    for (const attr of Object.keys(g.attributes)) {
      if (attr !== 'position' && attr !== 'normal') {
        g.deleteAttribute(attr);
      }
    }
    if (!buckets.has(matKey)) buckets.set(matKey, []);
    buckets.get(matKey).push(g);
  };

  const addBox = (matKey, pos, size) => {
    push(matKey, new THREE.BoxGeometry(...size).translate(...pos));
  };

  const addBeam = (matKey, p0, p1, w, h = w) => {
    const a = new THREE.Vector3(...p0);
    const b = new THREE.Vector3(...p1);
    const dir = b.clone().sub(a);
    const mid = a.clone().lerp(b, 0.5);
    const box = new THREE.BoxGeometry(dir.length(), h, w);
    box.applyQuaternion(
      new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), dir.normalize())
    );
    push(matKey, box.translate(mid.x, mid.y, mid.z));
  };

  const flushToGroup = (group, namePrefix = 'Airframe') => {
    for (const [matKey, geos] of buckets) {
      const merged = mergeGeometries(geos);
      const isMetallic = ['brass', 'aluminum', 'edge', 'blade'].includes(matKey);
      const isBeacon = matKey === 'red' || matKey === 'green';
      const mat = new THREE.MeshStandardMaterial({
        color: matKey === 'walnut' ? '#ffffff' : AIRFRAME_PALETTE[matKey],
        map: matKey === 'walnut' ? createWalnutTexture(merged) : null,
        metalness: isMetallic ? 0.42 : 0.1,
        roughness: matKey === 'glass' ? 0.2 : isMetallic ? 0.38 : 0.67,
        emissive: isBeacon ? AIRFRAME_PALETTE[matKey] : '#000000',
        emissiveIntensity: isBeacon ? 1.6 : 0,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(merged, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.name = `${namePrefix} · ${matKey}`;
      group.add(mesh);
      for (const g of geos) g.dispose();
    }
  };

  return { push, addBox, addBeam, flushToGroup };
}

/**
 * Builds the Boeing 777-300ER airframe split into:
 * - rootGroup (fuselage, cabin, tail, horizontal stabilizers)
 * - leftWingGroup / rightWingGroup (pivoted at wing root z = ±2.78 for authentic Wing Flex!)
 * - leftFanGroup / rightFanGroup (24 GE90 fan blades spinning inside the nacelles!)
 */
export function buildAirframeHierarchy() {
  const root = new THREE.Group();
  root.name = 'Boeing777Root';

  const body = makeBucketCollector();
  const lerp = THREE.MathUtils.lerp;

  const addFuselageStrip = (matKey, x0, x1, a0, a1, pad = 0, uSegs = 10) => {
    body.push(
      matKey,
      buildParametricGrid(uSegs, Math.max(3, Math.ceil(Math.abs(a1 - a0) * 12)), (u, v) =>
        fuselagePoint(lerp(x0, x1, u), lerp(a0, a1, v), pad)
      )
    );
  };

  // Fuselage skin (cutaway roof over cabin section)
  for (let i = 1; i < FUSELAGE_STATIONS.length; i++) {
    const x0 = FUSELAGE_STATIONS[i - 1][0];
    const x1 = FUSELAGE_STATIONS[i][0];
    addFuselageStrip('porcelain', x0, x1, -Math.PI, x0 === CABIN_START_X ? 0 : Math.PI, 0, 1);
  }
  for (const seamX of [-29.45, -24.1, 23.55, 27.1, 30.5]) {
    addFuselageStrip('edge', seamX, seamX + 0.022, -Math.PI, Math.PI, 0.006, 1);
  }

  // Cockpit windshield frames & glass
  const cockpitAngles = [0.2, 0.46, 0.96, Math.PI / 2, Math.PI - 0.96, Math.PI - 0.46, Math.PI - 0.2];
  const cockpitPt = (u, a, pad) => {
    const c = Math.pow(Math.abs(Math.cos(a)), 1.22);
    const xBase = -28.82 + 3.28 * c;
    return fuselagePoint(xBase + u * (1.29 + 0.28 * c), a, pad);
  };
  for (let i = 1; i < cockpitAngles.length; i++) {
    const a0 = cockpitAngles[i - 1];
    const a1 = cockpitAngles[i];
    body.push('aluminum', buildParametricGrid(6, 8, (u, v) => cockpitPt(u, a0 + (a1 - a0) * v, 0.025)));
    body.push(
      'glass',
      buildParametricGrid(6, 8, (u, v) => cockpitPt(0.04 + 0.92 * u, a0 + 0.012 + (a1 - a0 - 0.024) * v, 0.049))
    );
  }

  // Cabin flooring, runners, brass trims, bulkheads
  body.addBox('carpet', [(CABIN_END_X + CABIN_START_X) / 2, -0.085, 0], [CABIN_END_X - CABIN_START_X, 0.17, 6.69]);
  body.addBox('suite', [(CABIN_START_X - 13.8) / 2, 0.005, 0], [-13.8 - CABIN_START_X, 0.01, 6.56]);

  const aisleSections = [
    [CABIN_START_X, -13.8, 1.67],
    [-13.8, -3.3, 1.65],
    [-3.3, 4.5, 1.24],
    [4.5, CABIN_END_X, 1.17],
  ];
  for (const [x0, x1, zOff] of aisleSections) {
    for (const s of [-1, 1]) {
      body.addBox('runner', [(x0 + x1) / 2, 0.014, s * zOff], [x1 - x0, 0.01, 0.36]);
      for (const bOff of [-0.19, 0.19]) {
        body.addBox('brass', [(x0 + x1) / 2, 0.021, s * zOff + bOff], [x1 - x0, 0.008, 0.017]);
      }
    }
  }

  // Forward & aft end bulkheads
  for (const endX of [CABIN_START_X, CABIN_END_X]) {
    body.push(
      'ivory',
      buildParametricGrid(28, 1, (u, v) => {
        const pt = fuselagePoint(endX, Math.PI * u);
        return [endX, pt[1] * v, pt[2]];
      })
    );
    for (const s of [-1, 1]) {
      body.addBox('walnut', [endX, 0.78, s * 2.29], [0.105, 1.55, 1.5]);
      body.addBox('brass', [endX, 1.56, s * 2.29], [0.15, 0.046, 1.5]);
    }
  }

  // Class divider bulkheads (walnut + brass cap)
  for (const [divX, aisleZ] of [
    [-13.8, 1.58],
    [-3.3, 1.48],
    [4.5, 1.22],
  ]) {
    for (const [zPos, zLen] of [
      [0, aisleZ * 2 - 0.7],
      [-(3.31 + aisleZ + 0.35) / 2, 3.31 - aisleZ - 0.35],
      [(3.31 + aisleZ + 0.35) / 2, 3.31 - aisleZ - 0.35],
    ]) {
      body.addBox('walnut', [divX, 0.6, zPos], [0.09, 1.2, zLen]);
      body.addBox('brass', [divX, 1.215, zPos], [0.12, 0.04, zLen]);
    }
  }

  // 42 curved cabin window cutouts along both sides
  for (const sideSign of [-1, 1]) {
    const panelGeo = buildWindowPanelGeo(sideSign, 'panel');
    const lipGeo = buildWindowPanelGeo(sideSign, 'lip');
    const sealGeo = buildWindowPanelGeo(sideSign, 'seal');
    for (let i = 0; i < 42; i++) {
      const wx = -21 + i * 1.035;
      body.push('ivory', panelGeo.clone().translate(wx, 0, 0));
      body.push('porcelain', lipGeo.clone().translate(wx, 0, 0));
      body.push('rubber', sealGeo.clone().translate(wx, 0, 0));
    }
    panelGeo.dispose();
    lipGeo.dispose();
    sealGeo.dispose();

    const len = CABIN_END_X - CABIN_START_X;
    const mid = (CABIN_END_X + CABIN_START_X) / 2;
    body.addBox('brass', [mid, 1.994, sideSign * (fuselageWallZ(1.99) - 0.044)], [len, 0.04, 0.15]);
    body.addBox('runner', [mid, 0.53, sideSign * (fuselageWallZ(0.53) - 0.109)], [len, 0.12, 0.06]);
    body.addBox('brass', [mid, 0.605, sideSign * (fuselageWallZ(0.605) - 0.112)], [len, 0.017, 0.07]);

    for (const doorX of [-22.62, 23.11]) {
      const a = sideSign > 0 ? 0.12 : Math.PI - 0.12;
      const pt = fuselagePoint(doorX, a, 0.03);
      body.addBox('edge', [doorX, pt[1], pt[2]], [0.055, 1.1, 0.04]);
    }
  }

  // Wing & horizontal tail airfoil stations
  const mainWingStations = [
    [2.78, -6.2, 9.5, -0.64, 1.1],
    [4.7, -4.9, 9.2, -0.6, 0.91],
    [8.6, -2.58, 8.75, -0.52, 0.73],
    [12.1, -0.32, 9.25, -0.38, 0.54],
    [18.6, 4.65, 11.45, 0.02, 0.38],
    [23.3, 8.26, 12.92, 0.49, 0.24],
    [26.5, 11.12, 13.5, 1.14, 0.13],
  ];
  const hTailStations = [
    [1.8, 19.4, 27.75, 0.76, 0.59],
    [4.8, 21.38, 28.21, 1.14, 0.36],
    [10.25, 26.62, 29.54, 1.88, 0.13],
  ];

  const sampleAirfoil = (stations, spanZ, chordU, sideSign, upper, yPad = 0, zOffset = 0) => {
    let idx = stations.findIndex((s) => s[0] >= spanZ);
    if (idx < 0) idx = stations.length - 1;
    idx = Math.max(idx, 1);
    const s0 = stations[idx - 1];
    const s1 = stations[idx];
    const t = (spanZ - s0[0]) / (s1[0] - s0[0]);
    const thick = lerp(s0[4], s1[4], t);
    const profile = Math.sin(Math.PI * Math.pow(chordU, 0.61));
    return [
      lerp(lerp(s0[1], s1[1], t), lerp(s0[2], s1[2], t), chordU),
      lerp(s0[3], s1[3], t) + thick * profile * (upper ? 0.68 : -0.32) + yPad,
      spanZ * sideSign - zOffset,
    ];
  };

  const addAirfoilPatch = (collector, stations, sideSign, matKey, z0, z1, c0, c1, yPad = 0, upper = true, zOffset = 0) => {
    collector.push(
      matKey,
      buildParametricGrid(3, 8, (u, v) =>
        sampleAirfoil(stations, lerp(z0, z1, u), lerp(c0, c1, v), sideSign, upper, yPad, zOffset)
      )
    );
  };

  // Horizontal stabilizers stay attached to fuselage body
  for (const sideSign of [-1, 1]) {
    for (let i = 1; i < hTailStations.length; i++) {
      const z0 = hTailStations[i - 1][0];
      const z1 = hTailStations[i][0];
      addAirfoilPatch(body, hTailStations, sideSign, 'porcelain', z0, z1, 0, 1);
      addAirfoilPatch(body, hTailStations, sideSign, 'panel', z0, z1, 0, 1, 0, false);
      addAirfoilPatch(body, hTailStations, sideSign, 'aluminum', z0, z1, 0, 0.068, 0.013);
      for (const seam of [0.07, 0.727, 0.963]) {
        addAirfoilPatch(body, hTailStations, sideSign, 'edge', z0, z1, seam, seam + 0.004, 0.016);
      }
      addAirfoilPatch(body, hTailStations, sideSign, 'edge', z1 - 0.021, z1, 0.072, 0.965, 0.016);
    }
  }

  // Vertical tail fin with Aeris gold triple chevron stripes
  const finStations = [
    [0.92, 16.65, 29.1, 0.73],
    [2.15, 20, 29.16, 0.54],
    [3.07, 21.65, 29.25, 0.41],
    [7.68, 26.56, 29.72, 0.095],
    [7.86, 26.93, 29.7, 0.048],
  ];
  const sampleFin = (y, u, sideSign, zPad = 0) => {
    const idx = Math.max(1, finStations.findIndex((s) => s[0] >= y));
    const s0 = finStations[idx - 1];
    const s1 = finStations[idx];
    const t = (y - s0[0]) / (s1[0] - s0[0]);
    return [
      lerp(lerp(s0[1], s1[1], t), lerp(s0[2], s1[2], t), u),
      y,
      sideSign * (Math.sin(Math.PI * Math.pow(u, 0.65)) * lerp(s0[3], s1[3], t) + zPad),
    ];
  };
  for (const sideSign of [-1, 1]) {
    for (let i = 1; i < finStations.length; i++) {
      body.push(
        'graphite',
        buildParametricGrid(2, 12, (u, v) => sampleFin(lerp(finStations[i - 1][0], finStations[i][0], u), v, sideSign))
      );
    }
    for (let k = 0; k < 3; k++) {
      body.push(
        'brass',
        buildParametricGrid(8, 2, (u, v) =>
          sampleFin(3.71 + u * (2.07 - k * 0.28) + k * 0.55, 0.17 + 0.59 * u + v * (0.09 - 0.066 * u), sideSign, 0.017)
        )
      );
    }
    body.push('edge', buildParametricGrid(5, 1, (u, v) => sampleFin(lerp(2.27, 7.62, u), 0.81 + v * 0.007, sideSign, 0.008)));
  }

  body.flushToGroup(root, 'Airframe');

  // --- Separate Left & Right Wing Groups (pivoted at wing root z = ±2.78) for live Wing Flex! ---
  const WING_ROOT_Z = 2.78;
  const wings = {};
  const fans = {};

  const glyphStrokes = {
    A: [[0, 0, 0.32, 1], [0.32, 1, 0.67, 0], [0.13, 0.37, 0.55, 0.37]],
    E: [[0, 0, 0, 1], [0, 1, 0.62, 1], [0, 0.52, 0.49, 0.52], [0, 0, 0.62, 0]],
    R: [
      [0, 0, 0, 1], [0, 1, 0.47, 1], [0.47, 1, 0.62, 0.86], [0.62, 0.86, 0.62, 0.68],
      [0.62, 0.68, 0.47, 0.54], [0.47, 0.54, 0, 0.54], [0.32, 0.54, 0.68, 0],
    ],
    6: [
      [0.62, 1, 0.26, 1], [0.26, 1, 0, 0.7], [0, 0.7, 0, 0.15], [0, 0.15, 0.15, 0],
      [0.15, 0, 0.47, 0], [0.47, 0, 0.62, 0.15], [0.62, 0.15, 0.62, 0.4],
      [0.62, 0.4, 0.48, 0.55], [0.48, 0.55, 0, 0.55],
    ],
    '-': [[0.08, 0.49, 0.54, 0.49]],
  };

  for (const sideSign of [-1, 1]) {
    const key = sideSign < 0 ? 'left' : 'right';
    const pivotZ = sideSign * WING_ROOT_Z;
    const wingGroup = new THREE.Group();
    wingGroup.name = `Wing_${key}`;
    wingGroup.position.set(0, -0.64, pivotZ);

    const wc = makeBucketCollector();
    const yPivot = -0.64;

    const addWingAirfoil = (stations, matKey, z0, z1, c0, c1, yPad = 0, upper = true) => {
      wc.push(
        matKey,
        buildParametricGrid(3, 8, (u, v) => {
          const p = sampleAirfoil(stations, lerp(z0, z1, u), lerp(c0, c1, v), sideSign, upper, yPad, pivotZ);
          p[1] -= yPivot;
          return p;
        })
      );
    };

    // Main wing surface & details
    for (let i = 1; i < mainWingStations.length; i++) {
      const z0 = mainWingStations[i - 1][0];
      const z1 = mainWingStations[i][0];
      addWingAirfoil(mainWingStations, 'porcelain', z0, z1, 0, 1);
      addWingAirfoil(mainWingStations, 'panel', z0, z1, 0, 1, 0, false);
      addWingAirfoil(mainWingStations, 'aluminum', z0, z1, 0, 0.068, 0.013);
      for (const seam of [0.07, 0.727, 0.963]) {
        addWingAirfoil(mainWingStations, 'edge', z0, z1, seam, seam + 0.004, 0.016);
      }
      addWingAirfoil(mainWingStations, 'edge', z1 - 0.021, z1, 0.072, 0.965, 0.016);
    }

    // Flap track fairings under wing
    for (const fz of [6.8, 11.9, 17.1]) {
      const [fx, fy, fzz] = sampleAirfoil(mainWingStations, fz, 0.88, sideSign, false, 0, pivotZ);
      const sph = new THREE.SphereGeometry(1, 16, 8);
      sph.scale(2.06, 0.25, 0.27);
      wc.push('panel', sph.translate(fx + 0.44, fy - yPivot - 0.17, fzz));
    }

    // Wing rib & spoiler panel lines
    for (const rz of [5.35, 9.6, 13.85, 16.2, 20.95, 24.7]) {
      addWingAirfoil(mainWingStations, 'edge', rz, rz + 0.035, 0.59, 1, 0.019);
    }
    for (const [z0, z1] of [
      [5.4, 8.5], [8.68, 11.94], [12.15, 13.77],
      [13.92, 16.13], [16.25, 18.48], [18.71, 20.85],
    ]) {
      addWingAirfoil(mainWingStations, 'panel', z0, z1, 0.6, 0.712, 0.022);
    }

    // Raked winglet + gold band
    const wingletStations = [
      [26.47, 11.1, 13.5, 1.13, 0.12],
      [27.09, 11.8, 13.52, 1.62, 0.11],
      [27.72, 12.66, 13.59, 3.15, 0.08],
      [27.82, 13.08, 13.58, 3.47, 0.045],
    ];
    for (let i = 1; i < wingletStations.length; i++) {
      for (const upper of [true, false]) {
        addWingAirfoil(wingletStations, 'graphite', wingletStations[i - 1][0], wingletStations[i][0], 0, 1, 0, upper);
      }
    }
    addWingAirfoil(wingletStations, 'brass', 27.48, 27.64, 0.06, 0.97, 0.022);

    // Wingtip navigation beacon (Red Port / Green Starboard)
    const navSphere = new THREE.SphereGeometry(0.095, 8, 6);
    wc.push(
      sideSign === 1 ? 'green' : 'red',
      navSphere.translate(11.3, 1.25 - yPivot, sideSign * 26.55 - pivotZ)
    );

    // A6-AER registration letters on left (port) upper wing
    if (sideSign < 0) {
      Array.from('A6-AER').forEach((ch, idx) => {
        const ptFn = (gx, gy) => {
          const p = sampleAirfoil(mainWingStations, 16.4 + (idx * 0.87 + gx) * 1.15, 0.48 - gy * 0.18, -1, true, 0.03, pivotZ);
          p[1] -= yPivot;
          return p;
        };
        for (const [x0, y0, x1, y1] of glyphStrokes[ch]) {
          wc.addBeam('graphite', ptFn(x0, y0), ptFn(x1, y1), 0.046, 0.021);
        }
      });
    }

    // GE90 Engine pylon & nacelle
    const engZ = sideSign * 8.05 - pivotZ;
    const engY = -2.1 - yPivot;
    const engX = -3.15;
    wc.addBeam('aluminum', [engX - 0.6, engY + 0.82, engZ], [engX + 2.8, -0.5 - yPivot, engZ], 0.56, 0.57);

    const addRevolve = (x0, r0, x1, r1, matKey) => {
      wc.push(
        matKey,
        buildParametricGrid(1, 44, (u, v) => [
          engX + lerp(x0, x1, u),
          engY + Math.sin(v * Math.PI * 2) * lerp(r0, r1, u),
          engZ + Math.cos(v * Math.PI * 2) * lerp(r0, r1, u),
        ])
      );
    };
    const nacelleProfile = [
      [-2.72, 0.99], [-2.59, 1.16], [-2.21, 1.24], [-1.24, 1.31],
      [0.6, 1.28], [1.68, 1.07], [2.1, 0.93], [2.1, 0.78], [1.69, 0.73],
    ];
    for (let i = 1; i < nacelleProfile.length; i++) {
      const mKey = i <= 2 ? 'aluminum' : i >= 6 ? 'graphite' : 'porcelain';
      addRevolve(nacelleProfile[i - 1][0], nacelleProfile[i - 1][1], nacelleProfile[i][0], nacelleProfile[i][1], mKey);
    }
    addRevolve(-2.72, 0.99, -2.17, 0.91, 'graphite');
    addRevolve(-2.58, 0, -2.58, 0.98, 'black');
    addRevolve(1.59, 0.72, 2.48, 0.28, 'edge');
    addRevolve(2.48, 0.28, 2.72, 0.028, 'graphite');
    for (const [bx, br] of [[-1.19, 1.312], [0.65, 1.28]]) {
      addRevolve(bx, br, bx + 0.02, br, 'edge');
    }

    wc.flushToGroup(wingGroup, `Wing_${key}`);

    // Spinning 24-blade GE90 Turbofan group mounted inside the nacelle!
    const fanGroup = new THREE.Group();
    fanGroup.name = `EngineFan_${key}`;
    fanGroup.position.set(engX - 2.62, engY, engZ);

    const fanCollector = makeBucketCollector();
    for (let b = 0; b < 24; b++) {
      const a0 = (b * Math.PI) / 12;
      fanCollector.push(
        'blade',
        buildParametricGrid(3, 1, (u, v) => {
          const ang = a0 + u * 0.37 + v * 0.1;
          const rad = 0.2 + u * 0.725;
          return [0.03 * v, Math.sin(ang) * rad, Math.cos(ang) * rad];
        })
      );
    }
    const spinner = new THREE.SphereGeometry(1, 12, 10);
    fanCollector.push('aluminum', spinner.scale(0.26, 0.22, 0.22).translate(-0.06, 0, 0));
    fanCollector.flushToGroup(fanGroup, `Fan_${key}`);

    wingGroup.add(fanGroup);
    root.add(wingGroup);
    wings[key] = wingGroup;
    fans[key] = fanGroup;
  }

  return { root, wings, fans };
}

/**
 * Clean studio environment scene for PMREM reflections (identical aesthetic to original Aeris).
 */
export class StudioRoomEnvironment extends THREE.Scene {
  constructor() {
    super();
    const box = new THREE.BoxGeometry();
    box.deleteAttribute('uv');
    const backMat = new THREE.MeshStandardMaterial({ side: THREE.BackSide });
    const stdMat = new THREE.MeshStandardMaterial();
    const light = new THREE.PointLight(0xffffff, 900, 28, 2);
    light.position.set(0.418, 16.199, 0.3);
    this.add(light);

    const room = new THREE.Mesh(box, backMat);
    room.position.set(-0.757, 13.219, 0.717);
    room.scale.set(31.713, 28.305, 28.591);
    this.add(room);

    const blocks = new THREE.InstancedMesh(box, stdMat, 6);
    const dummy = new THREE.Object3D();
    const specs = [
      [[-10.906, 2.009, 1.846], [0, -0.195, 0], [2.328, 7.905, 4.651]],
      [[-5.607, -0.754, -0.758], [0, 0.994, 0], [1.97, 1.534, 3.955]],
      [[6.167, 0.857, 7.803], [0, 0.561, 0], [3.927, 6.285, 3.687]],
      [[-2.017, 0.018, 6.124], [0, 0.333, 0], [2.002, 4.566, 2.064]],
      [[2.291, -0.756, -2.621], [0, -0.286, 0], [1.546, 1.552, 1.496]],
      [[-2.193, -0.369, -5.547], [0, 0.516, 0], [3.875, 3.487, 2.986]],
    ];
    specs.forEach(([pos, rot, scl], i) => {
      dummy.position.set(...pos);
      dummy.rotation.set(...rot);
      dummy.scale.set(...scl);
      dummy.updateMatrix();
      blocks.setMatrixAt(i, dummy.matrix);
    });
    this.add(blocks);

    const makePanel = (intensity, pos, scl) => {
      const m = new THREE.Mesh(
        box,
        new THREE.MeshStandardMaterial({ color: 0, emissive: 0xffffff, emissiveIntensity: intensity })
      );
      m.position.set(...pos);
      m.scale.set(...scl);
      this.add(m);
    };
    makePanel(50, [-16.116, 14.37, 8.208], [0.1, 2.428, 2.739]);
    makePanel(50, [-16.109, 18.021, -8.207], [0.1, 2.425, 2.751]);
    makePanel(17, [14.904, 12.198, -1.832], [0.15, 4.265, 6.331]);
    makePanel(43, [-0.462, 8.89, 14.52], [4.38, 5.441, 0.088]);
    makePanel(20, [3.235, 11.486, -12.541], [2.5, 2, 0.1]);
    makePanel(100, [0, 20, 0], [1, 0.1, 1]);
  }

  dispose() {
    const disposables = new Set();
    this.traverse((o) => {
      if (o.isMesh) {
        disposables.add(o.geometry);
        disposables.add(o.material);
      }
    });
    for (const d of disposables) d.dispose();
  }
}
