/**
 * Procedural Spatial Cabin Audio Engine (Web Audio API)
 * - Simulates seat-position-dependent GE90 engine hum, airflow, and aft ambience
 * - Active Noise Cancellation (ANC) toggle with smooth filter & gain transition
 * - Turbulence rumble, distant lightning thunder, Boeing 777 seatbelt "ding-dong" chime,
 *   shutter glide, and booking confirmation chord
 */

class CabinAudioEngine {
  constructor() {
    this.ctx = null;
    this.enabled = false;
    this.ancEnabled = false;
    this.seatX = 0;
    this.seatNoiseDb = 68;
    this.turbulence = 0;

    // Audio nodes
    this.masterGain = null;
    this.ancFilter = null;
    this.rumbleGain = null;
    this.airGain = null;
    this.engineGain = null;
    this.engineOsc1 = null;
    this.engineOsc2 = null;
    this.turbGain = null;
    this.analyser = null;
    this.freqData = null;
  }

  _initContext() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    this.ctx = ctx;

    // Master chain: [layers] -> ancFilter -> masterGain -> analyser -> destination
    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.0001;

    const ancFilter = ctx.createBiquadFilter();
    ancFilter.type = 'lowpass';
    ancFilter.frequency.value = 1350;
    ancFilter.Q.value = 0.7;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 64;
    analyser.smoothingTimeConstant = 0.82;
    this.freqData = new Uint8Array(analyser.frequencyBinCount);

    ancFilter.connect(masterGain);
    masterGain.connect(analyser);
    analyser.connect(ctx.destination);

    this.masterGain = masterGain;
    this.ancFilter = ancFilter;
    this.analyser = analyser;

    // 1) Brown noise buffer (deep cabin fuselage rumble)
    const brownBuf = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
    const brownData = brownBuf.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < brownData.length; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.024 * white) / 1.022;
      brownData[i] = Math.max(-1, Math.min(1, lastOut * 2.4));
    }
    const brownSrc = ctx.createBufferSource();
    brownSrc.buffer = brownBuf;
    brownSrc.loop = true;

    const brownFilter = ctx.createBiquadFilter();
    brownFilter.type = 'lowpass';
    brownFilter.frequency.value = 320;

    const rumbleGain = ctx.createGain();
    rumbleGain.gain.value = 0.22;
    brownSrc.connect(brownFilter).connect(rumbleGain).connect(ancFilter);
    brownSrc.start();
    this.rumbleGain = rumbleGain;

    // 2) Pink/Air noise buffer (cabin ventilation & aft slipstream)
    const airBuf = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
    const airData = airBuf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < airData.length; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.997 * b0 + w * 0.029;
      b1 = 0.985 * b1 + w * 0.032;
      b2 = 0.950 * b2 + w * 0.048;
      airData[i] = (b0 + b1 + b2 + w * 0.04) * 0.45;
    }
    const airSrc = ctx.createBufferSource();
    airSrc.buffer = airBuf;
    airSrc.loop = true;

    const airFilter = ctx.createBiquadFilter();
    airFilter.type = 'bandpass';
    airFilter.frequency.value = 820;
    airFilter.Q.value = 0.65;

    const airGain = ctx.createGain();
    airGain.gain.value = 0.08;
    airSrc.connect(airFilter).connect(airGain).connect(ancFilter);
    airSrc.start();
    this.airGain = airGain;

    // 3) GE90 Turbofan harmonic drone (strongest near wing x ≈ -2..10)
    const engineOsc1 = ctx.createOscillator();
    engineOsc1.type = 'sine';
    engineOsc1.frequency.value = 68;

    const engineOsc2 = ctx.createOscillator();
    engineOsc2.type = 'triangle';
    engineOsc2.frequency.value = 136.6;

    const engineFilter = ctx.createBiquadFilter();
    engineFilter.type = 'lowpass';
    engineFilter.frequency.value = 210;

    const engineGain = ctx.createGain();
    engineGain.gain.value = 0.035;

    engineOsc1.connect(engineFilter);
    engineOsc2.connect(engineFilter);
    engineFilter.connect(engineGain).connect(ancFilter);
    engineOsc1.start();
    engineOsc2.start();
    this.engineGain = engineGain;
    this.engineOsc1 = engineOsc1;
    this.engineOsc2 = engineOsc2;

    // 4) Turbulence extra buffeting layer
    const turbSrc = ctx.createBufferSource();
    turbSrc.buffer = brownBuf;
    turbSrc.loop = true;
    turbSrc.playbackRate.value = 0.68;

    const turbFilter = ctx.createBiquadFilter();
    turbFilter.type = 'bandpass';
    turbFilter.frequency.value = 140;
    turbFilter.Q.value = 1.4;

    const turbGain = ctx.createGain();
    turbGain.gain.value = 0.0;
    turbSrc.connect(turbFilter).connect(turbGain).connect(ancFilter);
    turbSrc.start();
    this.turbGain = turbGain;
  }

  async toggle() {
    if (this.enabled) {
      this.enabled = false;
      if (this.ctx && this.masterGain) {
        const now = this.ctx.currentTime;
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.setTargetAtTime(0.0001, now, 0.08);
        setTimeout(() => {
          if (!this.enabled) this.ctx?.suspend().catch(() => {});
        }, 280);
      }
      return false;
    }

    this._initContext();
    await this.ctx.resume();
    this.enabled = true;
    this._applySpatialMix(0.18);
    return true;
  }

  async ensureEnabled() {
    if (!this.enabled) {
      await this.toggle();
    }
  }

  setANC(on) {
    this.ancEnabled = Boolean(on);
    if (this.ctx && this.enabled) {
      this._applySpatialMix(0.16);
    }
  }

  updateSpatialState({ seatX = 0, noiseDb = 68, turbulence = 0 }) {
    this.seatX = seatX;
    this.seatNoiseDb = noiseDb;
    this.turbulence = turbulence;
    if (this.ctx && this.enabled) {
      this._applySpatialMix(0.22);
    }
  }

  _applySpatialMix(tc = 0.2) {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // Engine proximity: GE90 is around x = -2.2
    const engineProx = Math.max(0.12, 1 - Math.abs(this.seatX - -1.5) / 17);
    // Aft slipstream factor: stronger behind wing (x > 8)
    const aftFactor = Math.max(0.25, Math.min(1.3, (this.seatX + 20) / 34));
    // First Suite quietness
    const forwardQuiet = this.seatX < -13.5 ? 0.58 : this.seatX < -3 ? 0.8 : 1.0;

    // ANC drastically cuts low-end engine hum and narrows frequency band
    const ancMult = this.ancEnabled ? 0.17 : 1.0;
    const ancFreq = this.ancEnabled ? 235 : 1420;

    this.ancFilter.frequency.setTargetAtTime(ancFreq, now, tc);
    this.masterGain.gain.setTargetAtTime(this.enabled ? 0.92 : 0.0001, now, tc);

    this.rumbleGain.gain.setTargetAtTime(
      (0.16 + engineProx * 0.14) * forwardQuiet * ancMult,
      now,
      tc
    );
    this.airGain.gain.setTargetAtTime(
      (0.045 + aftFactor * 0.075) * forwardQuiet * (this.ancEnabled ? 0.14 : 1.0),
      now,
      tc
    );
    this.engineGain.gain.setTargetAtTime(
      (0.014 + engineProx * 0.055) * forwardQuiet * (this.ancEnabled ? 0.08 : 1.0),
      now,
      tc
    );
    this.engineOsc1.frequency.setTargetAtTime(66 + this.turbulence * 7, now, tc);
    this.engineOsc2.frequency.setTargetAtTime(132.5 + this.turbulence * 14, now, tc);

    this.turbGain.gain.setTargetAtTime(
      this.turbulence * 0.28 * (this.ancEnabled ? 0.3 : 1.0),
      now,
      tc
    );
  }

  getEffectiveDb() {
    const turbDb = this.turbulence * 5.4;
    const ancReduction = this.ancEnabled ? -18.5 : 0;
    return Math.round((this.seatNoiseDb + turbDb + ancReduction) * 10) / 10;
  }

  getSpectrumBars(count = 8) {
    if (!this.analyser || !this.enabled || !this.freqData) {
      return new Array(count).fill(0.08);
    }
    this.analyser.getByteFrequencyData(this.freqData);
    const out = [];
    for (let i = 0; i < count; i++) {
      const idx = Math.min(this.freqData.length - 1, Math.floor((i / count) * 18));
      out.push(Math.max(0.08, Math.min(1, this.freqData[idx] / 210)));
    }
    return out;
  }

  // Authentic Boeing 777 cabin "Ding-Dong" seatbelt chime (A5 -> E5)
  playSeatbeltChime() {
    if (!this.enabled || !this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const notes = [
      { freq: 880.0, start: 0.0, dur: 0.55 },
      { freq: 659.25, start: 0.34, dur: 0.85 },
    ];
    notes.forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator();
      const overtone = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      overtone.type = 'sine';
      overtone.frequency.value = freq * 2;

      const overtoneGain = ctx.createGain();
      overtoneGain.gain.value = 0.14;

      gain.gain.setValueAtTime(0.0001, now + start);
      gain.gain.linearRampToValueAtTime(0.11, now + start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);

      osc.connect(gain);
      overtone.connect(overtoneGain).connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + start);
      overtone.start(now + start);
      osc.stop(now + start + dur + 0.05);
      overtone.stop(now + start + dur + 0.05);
    });
  }

  // Soft confirmation chord on seat booking
  playBookingChime() {
    if (!this.enabled || !this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t0 = now + i * 0.075;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(0.065, t0 + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.65);
      osc.connect(g).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.7);
    });
  }

  // Soft mechanical slide sound for window shade / dimmer
  playShutterClick() {
    if (!this.enabled || !this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(310, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.08);
    g.gain.setValueAtTime(0.04, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
    osc.connect(g).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  // Distant thunder rumble synced to storm lightning
  playThunder() {
    if (!this.enabled || !this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const buf = ctx.createBuffer(1, ctx.sampleRate * 1.6, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let v = 0;
    for (let i = 0; i < data.length; i++) {
      v = (v + 0.03 * (Math.random() * 2 - 1)) / 1.02;
      data[i] = v * 3.5;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = this.ancEnabled ? 90 : 185;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(this.ancEnabled ? 0.06 : 0.22, now + 0.15);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 1.55);
    src.connect(filter).connect(g).connect(ctx.destination);
    src.start(now);
  }

  dispose() {
    try {
      this.ctx?.close();
    } catch {
      // ignore
    }
    this.ctx = null;
  }
}

export const cabinAudio = new CabinAudioEngine();
