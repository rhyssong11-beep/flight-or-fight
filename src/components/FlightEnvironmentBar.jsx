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
    <section className="env-studio" aria-label="비행 환경 및 기내 음향 시뮬레이션">
      <div className="env-row timeline-row">
        <div className="env-label-group">
          <button
            type="button"
            className={`env-play-btn${timePlaying ? ' active' : ''}`}
            onClick={onToggleTimePlaying}
            title={timePlaying ? '비행 타임랩스 일시정지' : '16시간 비행 타임랩스 재생'}
            aria-label={timePlaying ? '비행 타임랩스 일시정지' : '16시간 비행 타임랩스 재생'}
          >
            {timePlaying ? <Pause size={12} /> : <Play size={12} />}
          </button>
          <div>
            <span className="env-kicker">극지방 비행 타임라인 · {env.elapsedLabel} / 16시간 15분</span>
            <strong className="env-phase">
              {env.auroraFactor > 0.45 ? (
                <Sparkles size={13} className="aurora-ic" aria-hidden="true" />
              ) : (
                <Sun size={13} className="sun-ic" aria-hidden="true" />
              )}
              {env.phaseName}
              <small> · {env.currentWaypoint.label} 상공</small>
            </strong>
          </div>
        </div>

        <div className="preset-pills" role="group" aria-label="비행 시간대 프리셋">
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
        <span className="tl-end">두바이 09:40</span>
        <input
          type="range"
          min={0}
          max={1000}
          value={Math.round(flightProgress * 1000)}
          onChange={(e) => onChangeProgress(Number(e.target.value) / 1000)}
          className="timeline-range"
          aria-label="두바이에서 로스앤젤레스 비행 시간 진행 슬라이더"
        />
        <span className="tl-end">LA 13:55</span>
      </div>

      <div className="env-row controls-row">
        <div className="env-group">
          <span className="env-sub">
            <CloudLightning size={12} aria-hidden="true" /> 기상 · 날개 탄성
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
            <Wind size={12} aria-hidden="true" /> 기내 음향
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
              {audioEnabled ? `${effectiveDb} dB` : '음소거'}
            </button>

            <button
              type="button"
              className={`anc-btn anc-pill${ancEnabled ? ' anc-on' : ''}`}
              onClick={onToggleAnc}
              aria-pressed={ancEnabled}
              title="액티브 노이즈 캔슬링(ANC) 헤드폰 차단 효과 체험"
            >
              <Headphones size={13} aria-hidden="true" />
              노이즈 캔슬링 {ancEnabled ? 'ON' : 'OFF'}
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
            {isWalkthrough ? '복도 투어 종료' : '기내 복도 걷기'}
          </button>
        </div>
      </div>
    </section>
  );
}
