import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SEATS, matchesSeatFilter } from '../data/cabinData';

const CABIN_COLORS = {
  first: ['#b8884d', '#72512c', '#d3b78b'],
  business: ['#546774', '#364857', '#a4afb0'],
  premium: ['#819780', '#495f53', '#bdc4a8'],
  economy: ['#96849e', '#665969', '#c2afc5'],
};

const HOVER_COLOR = new THREE.Color('#ffe08c');
const FILTER_PULSE_COLOR = new THREE.Color('#ffd066');
const OCCUPIED_GRAY = new THREE.Color('#6f716c');
const BOOKED_COLOR = new THREE.Color('#64ad7e');
const DIM_COLOR = new THREE.Color('#3b3c39');

function buildSeatParts() {
  const buckets = { fabric: [], shell: [], metal: [], screen: [] };

  for (const seat of SEATS) {
    const isFirst = seat.cabin === 'first';
    const isBiz = seat.cabin === 'business';
    const isPrem = seat.cabin === 'premium';

    const w = isFirst ? 0.79 : isBiz ? 0.69 : isPrem ? 0.57 : 0.44;
    const d = isFirst ? 0.94 : isBiz ? 0.81 : isPrem ? 0.68 : 0.56;
    const h = isFirst ? 1.24 : isBiz || isPrem ? 1.17 : 1.07;
    const [cMain, cDark, cLight] = CABIN_COLORS[seat.cabin];

    const add = (bucket, offset, scale, hex, rotZ = 0, detail = false) => {
      const dummy = new THREE.Object3D();
      dummy.position.set(seat.x + offset[0], offset[1], seat.z + offset[2]);
      dummy.scale.set(...scale);
      dummy.rotation.z = rotZ;
      dummy.updateMatrix();
      buckets[bucket].push({
        seat,
        matrix: dummy.matrix.clone(),
        base: new THREE.Color(hex),
        detail,
      });
    };

    const backX = d * 0.41;
    // Base & seat cushion
    add('shell', [0.01, 0.25, 0], [d * 0.76, 0.42, w * 0.77], '#403d39', 0, true);
    add('fabric', [-0.04, 0.49, 0], [d, 0.18, w], cMain);

    // Backrest shell & upholstery & headrest
    add('shell', [backX + 0.065, (h + 0.46) / 2, 0], [0.145, h - 0.4, w + 0.035], isBiz || isFirst ? '#d2c4aa' : '#625e59', -0.13, true);
    add('fabric', [backX - 0.016, (h + 0.46) / 2, 0], [0.15, h - 0.46, w], cDark, -0.13);
    add('fabric', [backX - 0.075, 0.71, 0], [0.11, 0.23, w * 0.86], cMain, -0.13, true);
    add('fabric', [backX + 0.016, h - 0.08, 0], [0.188, 0.235, w * 0.83], cLight, -0.13);
    add('fabric', [backX + 0.026, h + 0.037, 0], [0.159, 0.018, w * 0.51], isFirst || isBiz ? '#efdbbc' : '#e1d7c7', -0.08);

    // Armrests
    for (const s of [-1, 1]) {
      add('shell', [-0.006, 0.54, s * (w / 2 + 0.016)], [d * 0.76, 0.28, 0.045], '#81786a', 0, true);
      add('fabric', [-0.015, 0.69, s * (w / 2 + 0.016)], [d * 0.83, 0.075, 0.063], isFirst || isBiz ? '#8b7457' : cDark);
    }

    if (isFirst || isBiz) {
      const side = Math.sign(seat.z) || 1;
      const wallZ = side * (w / 2 + (isFirst ? 0.23 : 0.19));
      const wallLen = isFirst ? 1.84 : 1.37;
      const wallH = isFirst ? 0.96 : 0.83;
      add('shell', [-0.14, wallH / 2, wallZ], [wallLen, wallH, 0.075], isFirst ? '#795c40' : '#cebe9f');
      add('metal', [-0.14, wallH + 0.012, wallZ], [wallLen, 0.026, 0.078], isFirst ? '#cca26b' : '#a69a82');
      add('shell', [backX + 0.18, 0.5, side * 0.06], [0.11, 0.98, w + 0.3], isFirst ? '#917153' : '#d7c6ac');
      add('shell', [-0.24, 0.37, side * (w / 2 + 0.115)], [0.84, 0.72, 0.2], '#a18b6f', 0, true);
      add('shell', [-0.24, 0.744, side * (w / 2 + 0.115)], [0.85, 0.038, 0.21], isFirst ? '#855e3a' : '#e2cfb1');
      add('metal', [0.04, 0.776, side * (w / 2 + 0.115)], [0.075, 0.024, 0.108], '#c8ac79', 0, true);
      add('fabric', [-wallLen * 0.48, 0.34, 0], [isFirst ? 0.36 : 0.3, 0.22, w * 0.83], cMain);
      // Forward Suite / Business 4K OLED IFE screen facing passenger
      add('screen', [-wallLen * 0.54, 0.92, 0], [0.028, isFirst ? 0.36 : 0.28, isFirst ? 0.62 : 0.48], '#182433', 0, true);
    } else {
      if (isPrem) {
        add('fabric', [-d * 0.5, 0.32, 0], [0.16, 0.28, w * 0.91], cDark, -0.26, true);
      }
      // Seatback IFE screen on rear of backrest (visible from passenger seated behind!)
      add('screen', [backX + 0.146, 0.93, 0], [0.014, isPrem ? 0.21 : 0.18, w * 0.64], '#1a2736', -0.13, true);
    }
  }

  for (const list of Object.values(buckets)) {
    list.sort((a, b) => Number(a.detail) - Number(b.detail));
  }
  return buckets;
}

const SEAT_PARTS = buildSeatParts();

function buildBeveledCubeGeo() {
  const pos = [];
  const norm = [];
  const idx = [];
  for (let axis = 0; axis < 3; axis++) {
    for (let corner = 0; corner < 8; corner++) {
      for (let c = 0; c < 3; c++) {
        const s = corner & (1 << c) ? 1 : -1;
        pos.push(s * (c === axis ? 0.5 : 0.395));
        norm.push(c === axis ? s : 0);
      }
    }
  }
  const addPoly = (...verts) => {
    const a = new THREE.Vector3().fromArray(pos, verts[0] * 3);
    const b = new THREE.Vector3().fromArray(pos, verts[1] * 3).sub(a);
    const c = new THREE.Vector3().fromArray(pos, verts[2] * 3).sub(a);
    if (b.cross(c).dot(a) < 0) verts.reverse();
    for (let i = 1; i < verts.length - 1; i++) idx.push(verts[0], verts[i], verts[i + 1]);
  };
  for (let axis = 0; axis < 3; axis++) {
    const d1 = 1 << ((axis + 1) % 3);
    const d2 = 1 << ((axis + 2) % 3);
    for (const bit of [0, 1 << axis]) {
      const v0 = axis * 8 + bit;
      addPoly(v0, v0 + d1, v0 + d1 + d2, v0 + d2);
    }
    for (let bAxis = axis + 1; bAxis < 3; bAxis++) {
      const bit = 1 << (3 - axis - bAxis);
      for (let c = 0; c < 8; c++) {
        if (c & bit) continue;
        const m0 = axis * 8 + c;
        const m1 = bAxis * 8 + c;
        addPoly(m0, m0 + bit, m1 + bit, m1);
      }
    }
  }
  for (let c = 0; c < 8; c++) addPoly(c, 8 + c, 16 + c);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(norm, 3));
  geo.setIndex(idx);
  return geo;
}

const ZERO_MATRIX = new THREE.Matrix4().makeScale(0, 0, 0);

function InstancedSeatLayer({
  parts,
  finish,
  hoveredId,
  bookedSet,
  activeFilter,
  filterMatches,
  heroSeatId,
}) {
  const meshRef = useRef(null);
  const tmpColor = useMemo(() => new THREE.Color(), []);
  const geos = useMemo(() => {
    const box = new THREE.BoxGeometry(1, 1, 1);
    return {
      close: finish === 'fabric' ? buildBeveledCubeGeo() : box,
      far: box,
    };
  }, [finish]);

  const baseCount = useMemo(() => parts.filter((p) => !p.detail).length, [parts]);

  useEffect(
    () => () => {
      geos.close.dispose();
      if (geos.close !== geos.far) geos.far.dispose();
    },
    [geos]
  );

  // Sync instance matrices (hide the active hero seat so the articulated recline seat renders cleanly)
  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    parts.forEach((p, i) => {
      mesh.setMatrixAt(i, heroSeatId && p.seat.id === heroSeatId ? ZERO_MATRIX : p.matrix);
      mesh.setColorAt(i, p.base);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingBox();
    mesh.computeBoundingSphere();
  }, [parts, heroSeatId]);

  useFrame(({ camera, clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const isFar = camera.position.y > 32;
    mesh.count = isFar ? baseCount : parts.length;
    mesh.geometry = isFar ? geos.far : geos.close;

    const pulse = 0.52 + 0.42 * Math.sin(clock.elapsedTime * 4.4);
    const hasFilter = Boolean(activeFilter);

    for (let i = 0; i < mesh.count; i++) {
      const part = parts[i];
      const sid = part.seat.id;
      const isBooked = bookedSet.has(sid);
      const isOcc = part.seat.occupied;
      const isHover = hoveredId === sid;
      const isMatch = hasFilter && filterMatches.has(sid);

      tmpColor.copy(part.base);

      if (finish === 'screen') {
        // Subtle IFE glowing display screen
        if (isHover) tmpColor.lerp(HOVER_COLOR, 0.35);
      } else if (isHover) {
        tmpColor.lerp(HOVER_COLOR, 0.78);
      } else if (isBooked) {
        tmpColor.lerp(BOOKED_COLOR, finish === 'fabric' ? 0.68 : 0.38);
      } else if (isOcc) {
        // Clear visual separation for occupied seats (matches grey legend!)
        tmpColor.lerp(OCCUPIED_GRAY, finish === 'fabric' ? 0.78 : 0.55);
        tmpColor.multiplyScalar(0.76);
      } else if (hasFilter) {
        if (isMatch) {
          tmpColor.lerp(FILTER_PULSE_COLOR, pulse * (finish === 'fabric' ? 0.78 : 0.45));
        } else {
          tmpColor.lerp(DIM_COLOR, 0.62);
        }
      }

      mesh.setColorAt(i, tmpColor);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geos.close, undefined, parts.length]}
      castShadow={finish !== 'screen'}
      receiveShadow={finish !== 'screen'}
      frustumCulled={false}
    >
      {finish === 'screen' ? (
        <meshStandardMaterial
          color="#243a54"
          emissive="#4a7eb0"
          emissiveIntensity={0.42}
          roughness={0.22}
          metalness={0.35}
        />
      ) : (
        <meshStandardMaterial
          roughness={finish === 'fabric' ? 0.84 : 0.5}
          metalness={finish === 'metal' ? 0.62 : 0.05}
        />
      )}
    </instancedMesh>
  );
}

/**
 * Articulated Hero Seat rendered at the selected seat's exact position:
 * - Smoothly animates between Upright, Lounge, and 180° Lie-Flat Bed!
 * - Animates First Suite Privacy Sliding Door closing/opening!
 */
function ArticulatedHeroSeat({ seat, seatMode, privacyDoorClosed }) {
  const backrestRef = useRef(null);
  const legrestRef = useRef(null);
  const cushionRef = useRef(null);
  const doorRef = useRef(null);

  const smoothRecline = useRef(0);
  const smoothDoor = useRef(0);

  const isFirst = seat.cabin === 'first';
  const isBiz = seat.cabin === 'business';
  const isPrem = seat.cabin === 'premium';
  const w = isFirst ? 0.79 : isBiz ? 0.69 : isPrem ? 0.57 : 0.44;
  const d = isFirst ? 0.94 : isBiz ? 0.81 : isPrem ? 0.68 : 0.56;
  const h = isFirst ? 1.24 : isBiz || isPrem ? 1.17 : 1.07;
  const [cMain, cDark, cLight] = CABIN_COLORS[seat.cabin];
  const side = Math.sign(seat.z) || 1;
  const wallZ = side * (w / 2 + (isFirst ? 0.23 : 0.19));
  const wallLen = isFirst ? 1.84 : 1.37;
  const wallH = isFirst ? 0.96 : 0.83;

  useFrame((_, delta) => {
    const k = 1 - Math.exp(-Math.min(delta, 0.1) * 5.5);
    const targetRecline =
      seatMode === 'flat' ? 1.0 : seatMode === 'lounge' ? 0.48 : 0.0;
    smoothRecline.current += (targetRecline - smoothRecline.current) * k;

    const targetDoor = isFirst && privacyDoorClosed ? 1.0 : 0.0;
    smoothDoor.current += (targetDoor - smoothDoor.current) * k;

    const r = smoothRecline.current;
    if (backrestRef.current) {
      // Pivot at base of backrest: upright (-0.13 rad) -> flat (-1.48 rad for First/Biz, -0.45 for Prem/Eco)
      const maxTilt = isFirst || isBiz ? -1.48 : isPrem ? -0.48 : -0.34;
      backrestRef.current.rotation.z = THREE.MathUtils.lerp(-0.13, maxTilt, r);
    }
    if (legrestRef.current) {
      // Raise legrest horizontally as seat reclines
      const maxLift = isFirst || isBiz ? 1.38 : isPrem ? 0.85 : 0.35;
      legrestRef.current.rotation.z = THREE.MathUtils.lerp(-0.22, maxLift, r);
    }
    if (cushionRef.current) {
      // Slide cushion slightly forward during recline
      cushionRef.current.position.x = -0.04 - r * (isFirst || isBiz ? 0.22 : 0.06);
    }
    if (doorRef.current) {
      // First Suite sliding privacy door glides across the aisle opening
      const aisleSign = -side;
      doorRef.current.position.x = THREE.MathUtils.lerp(-0.72, -0.1, smoothDoor.current);
      doorRef.current.position.z = aisleSign * (w / 2 + 0.24);
      doorRef.current.scale.x = 0.22 + smoothDoor.current * 0.78;
    }
  });

  const backX = d * 0.41;

  return (
    <group position={[seat.x, 0, seat.z]}>
      {/* Base pedestal */}
      <mesh position={[0.01, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[d * 0.76, 0.42, w * 0.77]} />
        <meshStandardMaterial color="#403d39" roughness={0.55} />
      </mesh>

      {/* Seat cushion */}
      <mesh ref={cushionRef} position={[-0.04, 0.49, 0]} castShadow receiveShadow>
        <boxGeometry args={[d, 0.18, w]} />
        <meshStandardMaterial color={cMain} roughness={0.84} />
      </mesh>

      {/* Articulated Backrest pivoted at hip hinge */}
      <group ref={backrestRef} position={[backX - 0.02, 0.5, 0]}>
        <mesh position={[0.06, (h - 0.44) / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.145, h - 0.4, w + 0.035]} />
          <meshStandardMaterial color={isBiz || isFirst ? '#d2c4aa' : '#625e59'} roughness={0.5} />
        </mesh>
        <mesh position={[-0.01, (h - 0.46) / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.15, h - 0.46, w]} />
          <meshStandardMaterial color={cDark} roughness={0.85} />
        </mesh>
        <mesh position={[0.01, h - 0.54, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.19, 0.24, w * 0.83]} />
          <meshStandardMaterial color={cLight} roughness={0.85} />
        </mesh>
      </group>

      {/* Articulated Legrest / Footrest */}
      <group ref={legrestRef} position={[-d * 0.5, 0.42, 0]}>
        <mesh position={[0, -0.18, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.14, 0.36, w * 0.88]} />
          <meshStandardMaterial color={cDark} roughness={0.85} />
        </mesh>
      </group>

      {/* Armrests */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[-0.006, 0.54, s * (w / 2 + 0.016)]} castShadow>
            <boxGeometry args={[d * 0.76, 0.28, 0.045]} />
            <meshStandardMaterial color="#81786a" roughness={0.5} />
          </mesh>
          <mesh position={[-0.015, 0.69, s * (w / 2 + 0.016)]} castShadow>
            <boxGeometry args={[d * 0.83, 0.075, 0.063]} />
            <meshStandardMaterial color={isFirst || isBiz ? '#8b7457' : cDark} roughness={0.84} />
          </mesh>
        </group>
      ))}

      {/* Suite shell, console, Ottoman & First Suite Sliding Privacy Door */}
      {(isFirst || isBiz) && (
        <group>
          <mesh position={[-0.14, wallH / 2, wallZ]} castShadow receiveShadow>
            <boxGeometry args={[wallLen, wallH, 0.075]} />
            <meshStandardMaterial color={isFirst ? '#795c40' : '#cebe9f'} roughness={0.5} />
          </mesh>
          <mesh position={[-0.14, wallH + 0.012, wallZ]} castShadow>
            <boxGeometry args={[wallLen, 0.026, 0.078]} />
            <meshStandardMaterial color={isFirst ? '#cca26b' : '#a69a82'} metalness={0.6} roughness={0.38} />
          </mesh>
          <mesh position={[backX + 0.18, 0.5, side * 0.06]} castShadow receiveShadow>
            <boxGeometry args={[0.11, 0.98, w + 0.3]} />
            <meshStandardMaterial color={isFirst ? '#917153' : '#d7c6ac'} roughness={0.52} />
          </mesh>
          <mesh position={[-0.24, 0.744, side * (w / 2 + 0.115)]} castShadow>
            <boxGeometry args={[0.85, 0.038, 0.21]} />
            <meshStandardMaterial color={isFirst ? '#855e3a' : '#e2cfb1'} roughness={0.48} />
          </mesh>
          <mesh position={[-wallLen * 0.48, 0.34, 0]} castShadow receiveShadow>
            <boxGeometry args={[isFirst ? 0.36 : 0.3, 0.22, w * 0.83]} />
            <meshStandardMaterial color={cMain} roughness={0.84} />
          </mesh>
          {/* Glowing 32"/23" Suite OLED IFE Display */}
          <mesh position={[-wallLen * 0.54, 0.94, 0]}>
            <boxGeometry args={[0.028, isFirst ? 0.38 : 0.28, isFirst ? 0.64 : 0.48]} />
            <meshStandardMaterial color="#162333" emissive="#4d85b8" emissiveIntensity={0.55} roughness={0.2} />
          </mesh>

          {/* First Suite Sliding Privacy Door (walnut + brushed brass accent) */}
          {isFirst && (
            <group ref={doorRef} position={[-0.72, 0.72, -side * (w / 2 + 0.24)]}>
              <mesh castShadow receiveShadow>
                <boxGeometry args={[1.38, 1.42, 0.055]} />
                <meshStandardMaterial color="#7d5d40" roughness={0.52} />
              </mesh>
              <mesh position={[0, 0.72, 0]}>
                <boxGeometry args={[1.38, 0.032, 0.064]} />
                <meshStandardMaterial color="#cfa66d" metalness={0.62} roughness={0.34} />
              </mesh>
              {/* Frosted gold lattice detail strip */}
              <mesh position={[0, 0.15, 0]}>
                <boxGeometry args={[1.1, 0.38, 0.062]} />
                <meshStandardMaterial color="#d9c6a3" roughness={0.32} metalness={0.25} />
              </mesh>
            </group>
          )}
        </group>
      )}
    </group>
  );
}

export default function SeatsMesh({
  booked,
  hoveredId,
  selectedSeat,
  seatMode,
  privacyDoorClosed,
  activeFilter,
  env,
  interactive,
  onHover,
  onSelect,
}) {
  const hitboxRef = useRef(null);
  const bookedSet = useMemo(() => new Set(booked), [booked]);

  const filterMatches = useMemo(() => {
    const set = new Set();
    if (!activeFilter) return set;
    for (const seat of SEATS) {
      if (matchesSeatFilter(seat, activeFilter, env, bookedSet)) {
        set.add(seat.id);
      }
    }
    return set;
  }, [activeFilter, env, bookedSet]);

  useLayoutEffect(() => {
    const mesh = hitboxRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    SEATS.forEach((seat, i) => {
      const c = seat.cabin;
      dummy.position.set(seat.x, 0.68, seat.z);
      dummy.scale.set(
        c === 'first' ? 1.85 : c === 'business' ? 1.42 : c === 'premium' ? 1.0 : 0.88,
        1.38,
        c === 'first' ? 1.22 : c === 'business' ? 1.08 : c === 'premium' ? 0.72 : 0.54
      );
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingBox();
    mesh.computeBoundingSphere();
  }, []);

  // Ensure cursor resets if interactive becomes false
  useEffect(() => {
    if (!interactive) {
      document.body.style.cursor = '';
    }
    return () => {
      document.body.style.cursor = '';
    };
  }, [interactive]);

  const handleMove = (e) => {
    if (!interactive || e.instanceId === undefined) return;
    e.stopPropagation();
    const seat = SEATS[e.instanceId];
    if (!seat) return;
    const isBooked = bookedSet.has(seat.id);
    document.body.style.cursor = seat.occupied && !isBooked ? 'not-allowed' : 'pointer';
    const cx = e.nativeEvent?.clientX ?? e.clientX ?? 0;
    const cy = e.nativeEvent?.clientY ?? e.clientY ?? 0;
    onHover(seat, cx, cy);
  };

  const handleOut = () => {
    if (!interactive) return;
    document.body.style.cursor = '';
    onHover(null, 0, 0);
  };

  const handleClick = (e) => {
    if (!interactive || e.instanceId === undefined || e.delta > 8) return;
    e.stopPropagation();
    const seat = SEATS[e.instanceId];
    if (!seat) return;
    // Allow clicking available seats OR user's own booked seats (to revisit!)
    if (!seat.occupied || bookedSet.has(seat.id)) {
      document.body.style.cursor = '';
      onSelect(seat);
    }
  };

  const heroSeatId = selectedSeat ? selectedSeat.id : null;

  return (
    <group>
      {['shell', 'fabric', 'metal', 'screen'].map((finish) => (
        <InstancedSeatLayer
          key={finish}
          finish={finish}
          parts={SEAT_PARTS[finish]}
          hoveredId={hoveredId}
          bookedSet={bookedSet}
          activeFilter={activeFilter}
          filterMatches={filterMatches}
          heroSeatId={heroSeatId}
        />
      ))}

      {selectedSeat && (
        <ArticulatedHeroSeat
          seat={selectedSeat}
          seatMode={seatMode}
          privacyDoorClosed={privacyDoorClosed}
        />
      )}

      {/* Reliable raycasting hitboxes with transparent invisible material (visible=true so Three.js always raycasts!) */}
      <instancedMesh
        ref={hitboxRef}
        args={[undefined, undefined, SEATS.length]}
        frustumCulled={false}
        onPointerOver={interactive ? handleMove : undefined}
        onPointerMove={interactive ? handleMove : undefined}
        onPointerOut={interactive ? handleOut : undefined}
        onClick={interactive ? handleClick : undefined}
      >
        <boxGeometry />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
      </instancedMesh>
    </group>
  );
}
