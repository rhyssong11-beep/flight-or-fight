import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { CABINS } from '../data/cabinData';

const v3 = (x, y, z) => new THREE.Vector3(x, y, z);

function computeCameraPose(target, aspect, zoom) {
  if (target.kind === 'seat') {
    const s = target.seat;
    const sideSign = s.z < 0 ? -1 : 1;
    const eyeX = s.x - 0.11;
    // Slight inward offset for non-window seats so you see cabin & window realistically
    const lookTarget = s.isWindow
      ? v3(s.windowX, 1.26, sideSign * 3.33)
      : v3(s.windowX - 0.55, 1.22, sideSign * 3.28);
    return {
      position: v3(eyeX, 1.36, s.z),
      look: lookTarget,
      up: v3(0, 1, 0),
      fov: aspect < 1 ? 66 : 60,
    };
  }

  if (target.kind === 'walkthrough') {
    return {
      position: v3(-20.8, 1.66, -1.58),
      look: v3(-12.0, 1.35, -1.25),
      up: v3(0, 1, 0),
      fov: aspect < 1 ? 68 : 62,
    };
  }

  const cabin = target.kind === 'class' ? CABINS.find((c) => c.id === target.cabin) : undefined;
  const centerX = cabin ? (cabin.start + cabin.end) / 2 : 0;
  const span = cabin ? (cabin.end - cabin.start + 3) * 1.12 : 71;
  const distSpan = Math.max(cabin ? 10 : 44, span / aspect) / zoom;
  const fov = cabin ? 33 : 24;
  const dist = distSpan / (2 * Math.tan(THREE.MathUtils.degToRad(fov / 2)));
  const pitch = THREE.MathUtils.degToRad(cabin ? 15 : 43);
  const roll = THREE.MathUtils.degToRad(cabin ? 2 : 15);
  const look = v3(centerX, cabin ? 0.1 : 2, 0);

  return {
    position: v3(centerX, look.y + dist * Math.cos(pitch), dist * Math.sin(pitch)),
    look,
    up: v3(Math.sin(roll), Math.sin(pitch) * Math.cos(roll), -Math.cos(pitch) * Math.cos(roll)),
    fov,
  };
}

export default function CameraRig({
  target,
  zoom,
  seatMode,
  turbulenceLevel,
  lookResetTick,
  walkPaused,
  onWalkProgress,
  onSettled,
}) {
  const { camera, size, gl } = useThree();
  const onSettledRef = useRef(onSettled);
  onSettledRef.current = onSettled;
  const onWalkProgressRef = useRef(onWalkProgress);
  onWalkProgressRef.current = onWalkProgress;

  const aspect = size.width / Math.max(1, size.height);
  const pose = useMemo(() => computeCameraPose(target, aspect, zoom), [target, aspect, zoom]);
  const key =
    target.kind === 'seat'
      ? `seat:${target.seat.id}`
      : target.kind === 'class'
      ? `class:${target.cabin}`
      : target.kind === 'walkthrough'
      ? 'walkthrough'
      : 'overview';

  const prevKeyRef = useRef(null);
  const progressRef = useRef(1);
  const activeTweenRef = useRef(null);
  const lookVecRef = useRef(new THREE.Vector3());
  const smoothPointer = useRef(new THREE.Vector2());
  const tempLook = useMemo(() => new THREE.Vector3(), []);
  const baseDir = useMemo(() => new THREE.Vector3(), []);

  // Free-look yaw/pitch offsets (drag to look 360° inside seat view or orbit slightly in overview)
  const dragState = useRef({ active: false, lastX: 0, lastY: 0 });
  const lookOffset = useRef({ yaw: 0, pitch: 0, targetYaw: 0, targetPitch: 0 });
  const smoothReclineCam = useRef(0);

  // Walkthrough state
  const walkT = useRef(0);
  const lastWalkEmit = useRef(0);

  // Reset free-look offsets when requested or when switching target
  useEffect(() => {
    lookOffset.current.targetYaw = 0;
    lookOffset.current.targetPitch = 0;
  }, [lookResetTick, key]);

  // Pointer drag listener on WebGL canvas for 360° look-around & subtle orbit
  useEffect(() => {
    const dom = gl.domElement;
    if (!dom) return;

    const onDown = (e) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      e.preventDefault();
      dragState.current = { active: true, lastX: e.clientX, lastY: e.clientY };
    };
    const onMove = (e) => {
      if (!dragState.current.active) return;
      const dx = e.clientX - dragState.current.lastX;
      const dy = e.clientY - dragState.current.lastY;
      dragState.current.lastX = e.clientX;
      dragState.current.lastY = e.clientY;

      if (target.kind === 'seat' || target.kind === 'walkthrough') {
        // Full 360-degree yaw & comfortable pitch looking up to Starry Ceiling / down to Legroom
        lookOffset.current.targetYaw = THREE.MathUtils.clamp(
          lookOffset.current.targetYaw - dx * 0.0055,
          -Math.PI * 0.96,
          Math.PI * 0.96
        );
        lookOffset.current.targetPitch = THREE.MathUtils.clamp(
          lookOffset.current.targetPitch + dy * 0.0042,
          -0.68,
          0.88
        );
      } else {
        // Gentle pan/orbit in overview & class view
        lookOffset.current.targetYaw = THREE.MathUtils.clamp(
          lookOffset.current.targetYaw - dx * 0.0024,
          -0.65,
          0.65
        );
        lookOffset.current.targetPitch = THREE.MathUtils.clamp(
          lookOffset.current.targetPitch + dy * 0.002,
          -0.32,
          0.35
        );
      }
    };
    const onUp = () => {
      dragState.current.active = false;
    };

    dom.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      dom.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [gl, target.kind]);

  // GSAP transition between camera poses
  useLayoutEffect(() => {
    const isFirst = prevKeyRef.current === null;
    const isMajorChange = key !== prevKeyRef.current || progressRef.current < 1;
    prevKeyRef.current = key;
    smoothPointer.current.set(0, 0);
    if (target.kind === 'walkthrough') {
      walkT.current = 0;
    }

    const fromPos = camera.position.clone();
    const fromLook = lookVecRef.current.clone();
    const fromUp = camera.up.clone();
    const fromFov = camera.fov;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const state = { t: 0 };

    const apply = (t) => {
      progressRef.current = t;
      camera.position.lerpVectors(fromPos, pose.position, t);
      lookVecRef.current.lerpVectors(fromLook, pose.look, t);
      camera.up.lerpVectors(fromUp, pose.up, t).normalize();
      camera.fov = THREE.MathUtils.lerp(fromFov, pose.fov, t);
      camera.updateProjectionMatrix();
      camera.lookAt(lookVecRef.current);
    };

    if (isFirst || reduced) {
      apply(1);
      onSettledRef.current();
      return;
    }

    progressRef.current = 0;
    const tween = gsap.to(state, {
      paused: true,
      t: 1,
      duration: isMajorChange ? 1.55 : 0.44,
      ease: 'power3.inOut',
      onUpdate: () => apply(state.t),
      onComplete: () => onSettledRef.current(),
    });
    activeTweenRef.current = { tween, start: performance.now() };

    return () => {
      activeTweenRef.current = null;
      tween.kill();
    };
  }, [camera, pose, key, target.kind]);

  useFrame(({ pointer, clock }, delta) => {
    const dt = Math.min(delta, 0.1);
    const active = activeTweenRef.current;
    if (active) {
      const elapsedSec = (performance.now() - active.start) / 1000;
      active.tween.totalTime(Math.min(elapsedSec, active.tween.duration()));
      if (elapsedSec >= active.tween.duration()) {
        activeTweenRef.current = null;
      }
    }

    if (progressRef.current < 1) return;

    const smoothK = 1 - Math.exp(-dt * 8.5);
    lookOffset.current.yaw += (lookOffset.current.targetYaw - lookOffset.current.yaw) * smoothK;
    lookOffset.current.pitch += (lookOffset.current.targetPitch - lookOffset.current.pitch) * smoothK;

    const t = clock.elapsedTime;
    // Turbulence multi-octave vibration
    const turb = turbulenceLevel || 0;
    const shakeX = turb * (Math.sin(t * 17.3) * 0.022 + Math.cos(t * 29.1) * 0.012);
    const shakeY = turb * (Math.sin(t * 13.7) * 0.036 + Math.sin(t * 23.4) * 0.018);
    const shakeZ = turb * (Math.cos(t * 15.9) * 0.024);
    const bobY = Math.sin(t * 0.4) * 0.035;

    if (target.kind === 'walkthrough') {
      // 1st-person Aisle Walkthrough from First Suite (-20.8) to Economy aft (+20.4)
      if (!walkPaused) {
        walkT.current = Math.min(1, walkT.current + dt / 20);
      }
      const p = walkT.current;
      const walkX = THREE.MathUtils.lerp(-20.8, 20.4, p);
      // Smoothly follow port aisle lateral offset as cabin transitions from 1-2-1 to 2-3-2 to 3-4-3
      let aisleZ = -1.62;
      if (walkX > -3.5 && walkX < 5.0) {
        const lt = THREE.MathUtils.clamp((walkX + 3.5) / 8.5, 0, 1);
        aisleZ = THREE.MathUtils.lerp(-1.62, -1.2, lt);
      } else if (walkX >= 5.0) {
        aisleZ = -1.17;
      }
      const footstepBob = walkPaused ? 0 : Math.abs(Math.sin(t * 5.2)) * 0.032;
      camera.position.set(walkX + shakeX, 1.64 + bobY + footstepBob + shakeY, aisleZ + shakeZ);

      // Gentle cinematic look ahead + gentle cabin glance + user 360 drag override
      const autoSweep = walkPaused ? 0 : Math.sin(p * Math.PI * 5) * 0.24;
      const yaw = lookOffset.current.yaw + autoSweep;
      const pitch = -0.06 + lookOffset.current.pitch;
      // Forward walking direction is +X
      const dx = Math.cos(pitch) * Math.cos(yaw);
      const dy = Math.sin(pitch);
      const dz = Math.cos(pitch) * Math.sin(yaw);
      tempLook.set(camera.position.x + dx * 6, camera.position.y + dy * 6, camera.position.z + dz * 6);
      camera.up.set(0, 1, 0);
      camera.lookAt(tempLook);

      if (t - lastWalkEmit.current > 0.12) {
        lastWalkEmit.current = t;
        onWalkProgressRef.current?.(p, walkX);
      }
      return;
    }

    if (target.kind === 'seat') {
      // Smooth camera drop & slight recline shift when user switches to Lounge / 180° Lie-Flat!
      const isFlatCapable = target.seat.cabin === 'first' || target.seat.cabin === 'business';
      const targetRec =
        seatMode === 'flat' ? (isFlatCapable ? 1.0 : 0.45) : seatMode === 'lounge' ? 0.45 : 0.0;
      smoothReclineCam.current += (targetRec - smoothReclineCam.current) * (1 - Math.exp(-dt * 5));

      const rec = smoothReclineCam.current;
      const eyeY = pose.position.y - rec * (isFlatCapable ? 0.36 : 0.12) + bobY + shakeY;
      const eyeX = pose.position.x + rec * (isFlatCapable ? 0.22 : 0.08) + shakeX;
      const eyeZ = pose.position.z + shakeZ;
      camera.position.set(eyeX, eyeY, eyeZ);

      smoothPointer.current.x += (pointer.x - smoothPointer.current.x) * (1 - Math.exp(-dt * 7));
      smoothPointer.current.y += (pointer.y - smoothPointer.current.y) * (1 - Math.exp(-dt * 7));

      // Compute base spherical direction from eye to window
      baseDir.copy(pose.look).sub(pose.position).normalize();
      const baseYaw = Math.atan2(baseDir.z, baseDir.x);
      const basePitch = Math.asin(THREE.MathUtils.clamp(baseDir.y, -0.95, 0.95));

      const sideSign = Math.sign(pose.look.z) || 1;
      const parallaxYaw = -sideSign * smoothPointer.current.x * 0.075;
      const parallaxPitch = smoothPointer.current.y * 0.05 + rec * (isFlatCapable ? 0.18 : 0.04);

      const finalYaw = baseYaw + lookOffset.current.yaw + parallaxYaw;
      const finalPitch = THREE.MathUtils.clamp(
        basePitch + lookOffset.current.pitch + parallaxPitch,
        -0.85,
        1.05
      );

      tempLook.set(
        eyeX + Math.cos(finalPitch) * Math.cos(finalYaw) * 4,
        eyeY + Math.sin(finalPitch) * 4,
        eyeZ + Math.cos(finalPitch) * Math.sin(finalYaw) * 4
      );
      camera.up.set(0, 1, 0);
      camera.lookAt(tempLook);
      return;
    }

    // Overview / Class View: subtle user orbit + gentle turbulence shake
    const rel = pose.position.clone().sub(pose.look);
    const euler = new THREE.Euler(lookOffset.current.pitch, lookOffset.current.yaw, 0, 'YXZ');
    rel.applyEuler(euler);
    camera.position.copy(pose.look).add(rel);
    camera.position.x += shakeX * 4;
    camera.position.y += shakeY * 4;
    camera.up.copy(pose.up);
    camera.lookAt(pose.look);
  });

  return null;
}
