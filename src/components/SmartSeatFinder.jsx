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
      ? '양측 창문(A·K열) 모두 북극 오로라 관측 가능'
      : env.sunSide === 'port'
      ? '좌측(A열) 직사광선 · 우측(K열) 그늘 창가'
      : '우측(K열) 직사광선 · 좌측(A열) 그늘 창가';

  return (
    <div className="finder-bar" aria-label="3D 스마트 좌석 찾기 필터">
      <div className="finder-head">
        <span className="finder-title">
          <Sparkles size={12} aria-hidden="true" /> 3D 스마트 좌석 찾기
        </span>
        <span className="sun-tip">
          <Sun size={12} aria-hidden="true" /> {sunSummary}
        </span>
      </div>

      <div className="finder-chips" role="group" aria-label="조건에 맞는 좌석 3D 강조">
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
            aria-label="필터 초기화"
          >
            <X size={12} /> 해제
          </button>
        )}
      </div>
    </div>
  );
}
