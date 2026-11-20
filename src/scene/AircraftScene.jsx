import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { buildAirframeHierarchy, StudioRoomEnvironment } from './airframeGeometry';
import SkyAndClouds from './SkyAndClouds';
import {
  CabinCeilingAndMood,
  InteractiveWindowSet,
  LegroomRuler3D,
  SunDirectionBeacon,
} from './CabinInteriorExtras';
import SeatsMesh from './SeatsMesh';
import CameraRig from './CameraRig';
import { cabinAudio } from '../audio/cabinAudioEngine';

function checkWebGLSupport() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

class CanvasErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

function DynamicLighting({ env, stormLevel, lightningRef }) {
  const { scene, gl } = useThree();
  const sunLightRef = useRef(null);
  const fillLightRef = useRef(null);
  const hemiRef = useRef(null);
  const lightningLightRef = useRef(null);

  useLayoutEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const room = new StudioRoomEnvironment();
    const rt = pmrem.fromScene(room, 0.03);
    scene.environment = rt.texture;
    scene.environmentIntensity = 0.27;
    room.dispose();
    pmrem.dispose();
    return () => {
      scene.environment = null;
      rt.dispose();
    };
  }, [scene, gl]);

  const sunColorDay = useMemo(() => new THREE.Color('#fff9f0'), []);
  const sunColorGolden = useMemo(() => new THREE.Color('#ffecd2'), []);
  const sunColorNight = useMemo(() => new THREE.Color('#6a8fd6'), []);
  const hemiSkyGolden = useMemo(() => new THREE.Color('#f8e9d6'), []);
  const hemiSkyDay = useMemo(() => new THREE.Color('#dcecff'), []);
  const hemiSkyNight = useMemo(() => new THREE.Color('#273b5e'), []);
  const hemiSkyAurora = useMemo(() => new THREE.Color('#2b6b64'), []);
  const tmpColor = useMemo(() => new THREE.Color(), []);

  useFrame((_, delta) => {
    const k = 1 - Math.exp(-Math.min(delta, 0.1) * 5);

    if (sunLightRef.current) {
      const tx = env.sunDir[0] * 55;
      const ty = Math.max(8, env.sunDir[1] * 55 + 14);
      const tz = env.sunDir[2] * 55;
      sunLightRef.current.position.lerp(new THREE.Vector3(tx, ty, tz), k);

      tmpColor.copy(sunColorGolden).lerp(sunColorDay, env.daylightFactor).lerp(sunColorNight, env.nightFactor);
      sunLightRef.current.color.lerp(tmpColor, k);

      const targetIntensity =
        (1.85 - env.nightFactor * 1.15 + env.daylightFactor * 0.35) * (1 - stormLevel * 0.45);
      sunLightRef.current.intensity += (targetIntensity - sunLightRef.current.intensity) * k;
    }

    if (hemiRef.current) {
      tmpColor.copy(hemiSkyGolden).lerp(hemiSkyDay, env.daylightFactor).lerp(hemiSkyNight, env.nightFactor);
      if (env.auroraFactor > 0.2) tmpColor.lerp(hemiSkyAurora, env.auroraFactor * 0.45);
      hemiRef.current.color.lerp(tmpColor, k);
      const targetHemi = (0.95 - env.nightFactor * 0.38) * (1 - stormLevel * 0.25);
      hemiRef.current.intensity += (targetHemi - hemiRef.current.intensity) * k;
    }

    if (fillLightRef.current) {
      const targetFill = 0.35 + env.nightFactor * 0.25;
      fillLightRef.current.intensity += (targetFill - fillLightRef.current.intensity) * k;
    }

    const targetEnv = 0.28 - env.nightFactor * 0.13;
    scene.environmentIntensity += (targetEnv - scene.environmentIntensity) * k;

    if (lightningLightRef.current) {
      lightningLightRef.current.intensity = (lightningRef.current || 0) * 5.5;
    }
  });

  return (
    <>
      <hemisphereLight ref={hemiRef} args={['#f8e9d6', '#64748c', 0.93]} />
      <directionalLight
        ref={sunLightRef}
        position={[-38, 28, -23]}
        color="#ffecd2"
        intensity={1.8}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-36}
        shadow-camera-right={36}
        shadow-camera-top={33}
        shadow-camera-bottom={-33}
        shadow-camera-near={1}
        shadow-camera-far={120}
        shadow-bias={-0.0003}
        shadow-normalBias={0.027}
      />
      <directionalLight ref={fillLightRef} position={[19, 10, 27]} color="#d4dded" intensity={0.35} />
      <directionalLight ref={lightningLightRef} position={[-12, 35, 16]} color="#cfe2ff" intensity={0} />
    </>
  );
}

function AircraftAssembly({
  booked,
  hoveredId,
  selectedSeat,
  seatMode,
  privacyDoorClosed,
  activeFilter,
  env,
  turbulenceLevel,
  stormLevel,
  seatbeltOn,
  dimLevel,
  shutterPos,
  frostEnabled,
  heightCm,
  showLegroomRuler,
  showSunBeacon,
  interactive,
  onHover,
  onSelect,
  lightningRef,
}) {
  const groupRef = useRef(null);
  const airframe = useMemo(() => buildAirframeHierarchy(), []);
  const nextLightningRef = useRef(2.2);

  useEffect(
    () => () => {
      airframe.root.traverse((obj) => {
        if (obj.isMesh) {
          obj.geometry?.dispose();
          obj.material?.map?.dispose();
          obj.material?.dispose();
        }
      });
    },
    [airframe]
  );

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.1);
    const t = clock.elapsedTime;
    const turb = turbulenceLevel || 0;

    // Fuselage gentle cruise float + turbulence buffeting roll/pitch
    if (groupRef.current) {
      const cruiseBob = Math.sin(t * 0.4) * 0.035;
      const turbBump = turb * (Math.sin(t * 9.5) * 0.065 + Math.cos(t * 15.2) * 0.035);
      groupRef.current.position.y = cruiseBob + turbBump;
      groupRef.current.rotation.x = turb * Math.sin(t * 6.4) * 0.011;
      groupRef.current.rotation.z = turb * Math.cos(t * 5.2) * 0.006;
    }

    // Authentic Wing Flex! Wings flex slightly upward in lift and bounce elastically in turbulence
    const baseLiftFlex = 0.012 + Math.sin(t * 1.1) * 0.004;
    const turbFlex =
      turb * (Math.sin(t * 7.8) * 0.026 + Math.sin(t * 13.4) * 0.014 + Math.cos(t * 4.1) * 0.012);
    const totalFlex = baseLiftFlex + turbFlex;
    if (airframe.wings.left) {
      // Port wing (z < 0): positive rotation.x bends tip upward
      airframe.wings.left.rotation.x = totalFlex;
    }
    if (airframe.wings.right) {
      // Starboard wing (z > 0): negative rotation.x bends tip upward
      airframe.wings.right.rotation.x = -totalFlex;
    }

    // Spinning 24-blade GE90 Turbofans
    const fanSpeed = 14 + turb * 5;
    if (airframe.fans.left) airframe.fans.left.rotation.x += dt * fanSpeed;
    if (airframe.fans.right) airframe.fans.right.rotation.x += dt * fanSpeed;

    // Storm lightning flashes + distant thunder rumble
    if (stormLevel > 0.55) {
      nextLightningRef.current -= dt;
      if (nextLightningRef.current <= 0) {
        lightningRef.current = 1.0;
        nextLightningRef.current = 2.6 + Math.random() * 4.5;
        cabinAudio.playThunder();
      }
    }
    if (lightningRef.current > 0) {
      lightningRef.current = Math.max(0, lightningRef.current - dt * 4.8);
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={airframe.root} />
      <CabinCeilingAndMood env={env} seatbeltOn={seatbeltOn} />
      <InteractiveWindowSet
        seat={selectedSeat}
        dimLevel={dimLevel}
        shutterPos={shutterPos}
        frostEnabled={frostEnabled}
        env={env}
      />
      <LegroomRuler3D seat={selectedSeat} heightCm={heightCm} visible={showLegroomRuler} />
      <SunDirectionBeacon env={env} active={showSunBeacon} />
      <SeatsMesh
        booked={booked}
        hoveredId={hoveredId}
        selectedSeat={selectedSeat}
        seatMode={seatMode}
        privacyDoorClosed={privacyDoorClosed}
        activeFilter={activeFilter}
        env={env}
        interactive={interactive}
        onHover={onHover}
        onSelect={onSelect}
      />
    </group>
  );
}

function FallbackPoster({ target, onSettled }) {
  useEffect(() => {
    onSettled?.();
  }, [target, onSettled]);
  return (
    <div className="scene-poster">
      <span role="alert">이 브라우저에서 3D WebGL을 사용할 수 없습니다. 좌석 배치도에서 좌석을 선택해 주세요.</span>
    </div>
  );
}

export default function AircraftScene(props) {
  const [webglReady] = useState(() => checkWebGLSupport());
  const lightningRef = useRef(0);

  if (!webglReady) {
    return <FallbackPoster target={props.target} onSettled={props.onSettled} />;
  }

  return (
    <CanvasErrorBoundary fallback={<FallbackPoster target={props.target} onSettled={props.onSettled} />}>
      <Canvas
        shadows="soft"
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: false,
          preserveDrawingBuffer: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
        }}
        camera={{ fov: 33, near: 0.045, far: 1000, position: [0, 64, 30] }}
        onCreated={({ gl, setDpr }) => {
          props.onCanvasReady?.(gl.domElement);
          try {
            const ctx = gl.getContext();
            const dbg = ctx.getExtension('WEBGL_debug_renderer_info');
            if (dbg && /swiftshader|llvmpipe|software/i.test(ctx.getParameter(dbg.UNMASKED_RENDERER_WEBGL))) {
              setDpr(Math.min(window.devicePixelRatio || 1, 1));
            }
          } catch {
            // ignore
          }
        }}
        onPointerMissed={() => props.onHover?.(null, 0, 0)}
      >
        <CameraRig
          target={props.target}
          zoom={props.zoom}
          seatMode={props.seatMode}
          turbulenceLevel={props.turbulenceLevel}
          lookResetTick={props.lookResetTick}
          lookPreset={props.lookPreset}
          walkPaused={props.walkPaused}
          onWalkProgress={props.onWalkProgress}
          onSettled={props.onSettled}
        />
        <DynamicLighting env={props.env} stormLevel={props.stormLevel} lightningRef={lightningRef} />
        <SkyAndClouds env={props.env} stormLevel={props.stormLevel} lightningRef={lightningRef} />
        <AircraftAssembly
          booked={props.booked}
          hoveredId={props.hoveredId}
          selectedSeat={props.selectedSeat}
          seatMode={props.seatMode}
          privacyDoorClosed={props.privacyDoorClosed}
          activeFilter={props.activeFilter}
          env={props.env}
          turbulenceLevel={props.turbulenceLevel}
          stormLevel={props.stormLevel}
          seatbeltOn={props.seatbeltOn}
          dimLevel={props.dimLevel}
          shutterPos={props.shutterPos}
          frostEnabled={props.frostEnabled}
          heightCm={props.heightCm}
          showLegroomRuler={props.showLegroomRuler}
          showSunBeacon={props.showSunBeacon}
          interactive={props.interactive}
          onHover={props.onHover}
          onSelect={props.onSelect}
          lightningRef={lightningRef}
        />
      </Canvas>
    </CanvasErrorBoundary>
  );
}
