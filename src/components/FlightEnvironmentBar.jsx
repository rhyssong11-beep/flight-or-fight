import React, { useEffect, useState } from 'react';
import {
  CloudLightning,
  Footprints,
  Headphones,
  Pause,
  Play,
  Sparkles,
  Sun,
  Wind,
} from 'lucide-react';
import { TIME_PRESETS, WEATHER_MODES } from '../data/cabinData';
import { cabinAudio } from '../audio/cabinAudioEngine';

export default function FlightEnvironmentBar({
  flightProgress,
  onChangeProgress,
  timePlaying,
  onToggleTimePlaying,
  env,
  weatherId,
  onChangeWeather,
  audioEnabled,
  onToggleAudio,
  ancEnabled,
  onToggleAnc,
  effectiveDb,
  isWalkthrough,
  onToggleWalkthrough,
  disabledWalk,
}) {
  const [bars, setBars] = useState(() => new Array(7).fill(0.15));

  useEffect(() => {
    if (!audioEnabled) {
      setBars(new Array(7).fill(0.12));
      return;
    }
    const id = setInterval(() => {
      setBars(cabinAudio.getSpectrumBars(7));
    }, 90);
    return () => clearInterval(id);
  }, [audioEnabled]);

  return (
    <section className="env-studio" aria-label="Flight atmosphere and audio controls">
      {/* Row 1: 16h Polar Flight Timeline + Sky Presets */}
      <div className="env-row timeline-row">
        <div className="env-label-group">
          <button
            type="button"
            className={`env-play-btn${timePlaying ? ' active' : ''}`}
            onClick={onToggleTimePlaying}
            title={timePlaying ? 'Pause flight timelapse' : 'Play 16h flight timelapse'}
            aria-label={timePlaying ? 'Pause flight timelapse' : 'Play 16h flight timelapse'}
          >
            {timePlaying ? <Pause size={12} /> : <Play size={12} />}
          </button>
          <div>
            <span className="env-kicker">POLAR FLIGHT TIMELINE · {env.elapsedLabel} / 16h 15m</span>
            <strong className="env-phase">
              {env.auroraFactor > 0.45 ? (
                <Sparkles size={13} className="aurora-ic" aria-hidden="true" />
              ) : (
                <Sun size={13} className="sun-ic" aria-hidden="true" />
              )}
              {env.phaseName}
              <small> · Over {env.currentWaypoint.label}</small>
            </strong>
          </div>
        </div>

        <div className="preset-pills" role="group" aria-label="Sky time presets">
          {TIME_PRESETS.map((preset) => {
            const active = Math.abs(flightProgress - preset.progress) < 0.07;
            return (
              <button
                key={preset.id}
                type="button"
                className={`preset-pill${active ? ' active' : ''}${preset.id === 'aurora' ? ' aurora' : ''}`}
                onClick={() => onChangeProgress(preset.progress)}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="timeline-slider-wrap">
        <span className="tl-end">DXB 09:40</span>
        <input
          type="range"
          min={0}
          max={1000}
          value={Math.round(flightProgress * 1000)}
          onChange={(e) => onChangeProgress(Number(e.target.value) / 1000)}
          className="timeline-range"
          aria-label="Flight time progression from Dubai to Los Angeles"
        />
        <span className="tl-end">LAX 13:55</span>
      </div>

      {/* Row 2: Weather / Turbulence + Spatial Audio & ANC + Cabin Walkthrough */}
      <div className="env-row controls-row">
        <div className="env-group">
          <span className="env-sub">
            <CloudLightning size={12} aria-hidden="true" /> Weather &amp; Wing Flex
          </span>
          <div className="seg-group">
            {WEATHER_MODES.map((w) => (
              <button
                key={w.id}
                type="button"
                className={`${weatherId === w.id ? 'active' : ''}${w.id === 'storm' && weatherId === 'storm' ? ' storm-active' : ''}`}
                onClick={() => onChangeWeather(w.id)}
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>

        <div className="env-group audio-group">
          <span className="env-sub">
            <Wind size={12} aria-hidden="true" /> Cabin Acoustics
          </span>
          <div className="audio-controls-inline">
            <button
              type="button"
              className={`anc-btn${audioEnabled ? ' active' : ''}`}
              onClick={onToggleAudio}
              aria-pressed={audioEnabled}
            >
              <span className="mini-bars" aria-hidden="true">
                {bars.map((v, i) => (
                  <i key={i} style={{ height: `${Math.round(4 + v * 12)}px` }} />
                ))}
              </span>
              {audioEnabled ? `${effectiveDb} dB` : 'Audio Off'}
            </button>

            <button
              type="button"
              className={`anc-btn anc-pill${ancEnabled ? ' anc-on' : ''}`}
              onClick={onToggleAnc}
              aria-pressed={ancEnabled}
              title="Experience Active Noise Cancellation headphone isolation"
            >
              <Headphones size={13} aria-hidden="true" />
              ANC {ancEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        <div className="env-group walk-group">
          <button
            type="button"
            className={`walk-btn${isWalkthrough ? ' active' : ''}`}
            onClick={onToggleWalkthrough}
            disabled={disabledWalk}
          >
            <Footprints size={14} aria-hidden="true" />
            {isWalkthrough ? 'Exit Aisle Walk' : 'Walk the Cabin'}
          </button>
        </div>
      </div>
    </section>
  );
}
