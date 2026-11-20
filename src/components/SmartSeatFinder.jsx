import React, { useMemo } from 'react';
import { Sparkles, Sun, X } from 'lucide-react';
import { SEAT_FILTERS, SEATS, matchesSeatFilter } from '../data/cabinData';

export default function SmartSeatFinder({ activeFilter, onChangeFilter, env, booked }) {
  const bookedSet = useMemo(() => new Set(booked), [booked]);

  const matchCount = useMemo(() => {
    if (!activeFilter) return 0;
    let c = 0;
    for (const s of SEATS) {
      if (matchesSeatFilter(s, activeFilter, env, bookedSet)) c++;
    }
    return c;
  }, [activeFilter, env, bookedSet]);

  const sunSummary =
    env.sunSide === 'aurora'
      ? 'Polar Aurora visible on both A & K windows'
      : env.sunSide === 'port'
      ? 'Direct sun on Left (A-side) · Shade on Right (K-side)'
      : 'Direct sun on Right (K-side) · Shade on Left (A-side)';

  return (
    <div className="finder-bar" aria-label="3D X-Ray Smart Seat Finder">
      <div className="finder-head">
        <span className="finder-title">
          <Sparkles size={12} aria-hidden="true" /> 3D SEAT FINDER
        </span>
        <span className="sun-tip">
          <Sun size={12} aria-hidden="true" /> {sunSummary}
        </span>
      </div>

      <div className="finder-chips" role="group" aria-label="Highlight matching seats in 3D">
        {SEAT_FILTERS.map((f) => {
          const isActive = activeFilter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              className={`finder-chip${isActive ? ' active' : ''}`}
              onClick={() => onChangeFilter(isActive ? null : f.id)}
              title={f.desc}
              aria-pressed={isActive}
            >
              {f.label}
              {isActive && <b className="chip-count">{matchCount}</b>}
            </button>
          );
        })}
        {activeFilter && (
          <button
            type="button"
            className="finder-clear"
            onClick={() => onChangeFilter(null)}
            aria-label="Clear seat filter"
          >
            <X size={12} /> Clear
          </button>
        )}
      </div>
    </div>
  );
}
