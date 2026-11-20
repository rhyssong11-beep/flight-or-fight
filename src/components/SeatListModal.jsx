import React, { useMemo } from 'react';
import { Check, Sparkles, Sun, Wind } from 'lucide-react';
import { CABINS, CABIN_BY_ID, SEATS, formatPrice, matchesSeatFilter } from '../data/cabinData';

export default function SeatListModal({
  cabinId,
  onChangeCabin,
  booked,
  activeFilter,
  env,
  onSelectSeat,
}) {
  const bookedSet = useMemo(() => new Set(booked), [booked]);
  const cabin = CABIN_BY_ID[cabinId] || CABINS[0];

  const rows = useMemo(() => {
    const cabinSeats = SEATS.filter((s) => s.cabin === cabin.id);
    const byRow = new Map();
    for (const s of cabinSeats) {
      if (!byRow.has(s.row)) byRow.set(s.row, []);
      byRow.get(s.row).push(s);
    }
    return Array.from(byRow.entries()).sort((a, b) => a[0] - b[0]);
  }, [cabin.id]);

  const columnsWithAisles = useMemo(() => {
    const cols = [];
    cabin.columns.forEach((letter, idx) => {
      cols.push({ kind: 'seat', letter, colIdx: idx });
      if (cabin.aisleAfter.includes(idx)) {
        cols.push({ kind: 'aisle', key: `aisle-${idx}` });
      }
    });
    return cols;
  }, [cabin]);

  const gridTemplate = useMemo(() => {
    const parts = ['28px'];
    columnsWithAisles.forEach((c) => {
      parts.push(c.kind === 'aisle' ? '14px' : 'minmax(0, 1fr)');
    });
    return parts.join(' ');
  }, [columnsWithAisles]);

  const leftTag = env.sunSide === 'aurora' ? '오로라 (A)' : env.sunSide === 'port' ? '햇빛 (A)' : '그늘 (A)';
  const rightTag = env.sunSide === 'aurora' ? '오로라 (K)' : env.sunSide === 'starboard' ? '햇빛 (K)' : '그늘 (K)';

  return (
    <div className="seatmap-modal">
      <div className="list-select">
        <label htmlFor="cabin-choice">객실 클래스</label>
        <select
          id="cabin-choice"
          value={cabin.id}
          onChange={(e) => onChangeCabin(e.target.value)}
        >
          {CABINS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.layout} 배열) · {formatPrice(c.price)}
            </option>
          ))}
        </select>
      </div>

      <div className="seatmap-orient">
        <span className={env.sunSide === 'port' ? 'is-sun' : ''}>
          {env.sunSide === 'aurora' ? <Sparkles size={11} /> : <Sun size={11} />} {leftTag}
        </span>
        <span className="orient-center">{cabin.layout} 실제 기내 배열 · 기수 방향 ▲</span>
        <span className={env.sunSide === 'starboard' ? 'is-sun' : ''}>
          {rightTag} {env.sunSide === 'aurora' ? <Sparkles size={11} /> : <Sun size={11} />}
        </span>
      </div>

      <div className="seatmap-header" style={{ gridTemplateColumns: gridTemplate }}>
        <span className="row-num-hd">열</span>
        {columnsWithAisles.map((col) =>
          col.kind === 'aisle' ? (
            <span key={col.key} className="aisle-hd" aria-hidden="true" />
          ) : (
            <span key={col.letter} className="col-hd">
              {col.letter}
            </span>
          )
        )}
      </div>

      <div className="seatmap-rows" role="list">
        {rows.map(([rowNum, rowSeats]) => {
          const isExit = rowSeats[0]?.isExitRow;
          const isWing = rowSeats[0]?.isOverWing;
          return (
            <React.Fragment key={rowNum}>
              {isExit && (
                <div className="exit-divider">
                  <span>◄ 비상구 열 · 넓은 레그룸 (38&quot;)</span>
                  <span>비상구 ►</span>
                </div>
              )}
              <div
                className={`seatmap-row${isWing ? ' over-wing' : ''}`}
                style={{ gridTemplateColumns: gridTemplate }}
                role="listitem"
              >
                <span className="row-num" title={isWing ? `${rowNum}열 (날개 구역)` : `${rowNum}열`}>
                  {rowNum}
                  {isWing && <Wind size={9} className="wing-dot" aria-hidden="true" />}
                </span>
                {columnsWithAisles.map((col) => {
                  if (col.kind === 'aisle') {
                    return <span key={col.key} className="aisle-gap" aria-hidden="true" />;
                  }
                  const seat = rowSeats.find((s) => s.col === col.letter);
                  if (!seat) return <span key={col.letter} />;
                  const isBooked = bookedSet.has(seat.id);
                  const isDisabled = seat.occupied && !isBooked;
                  const isFiltered = activeFilter && matchesSeatFilter(seat, activeFilter, env, bookedSet);

                  return (
                    <button
                      key={seat.id}
                      type="button"
                      className={`smap-btn${isBooked ? ' is-booked' : ''}${isFiltered ? ' is-match' : ''}`}
                      disabled={isDisabled}
                      onClick={() => onSelectSeat(seat)}
                      aria-label={`${seat.id} 좌석, ${seat.positionLabel}, ${
                        isBooked ? '내 예약 좌석, 클릭하여 3D 보기' : isDisabled ? '예약됨' : '선택 가능'
                      }`}
                      title={`${seat.id} 좌석 · ${seat.viewLabel} · ${seat.noiseDb} dB`}
                    >
                      {isBooked ? <Check size={11} aria-hidden="true" /> : seat.id}
                    </button>
                  );
                })}
              </div>
            </React.Fragment>
          );
        })}
      </div>

      <div className="seatmap-legend">
        <span><i className="lg-avail" /> 선택 가능</span>
        <span><i className="lg-occ" /> 예약됨</span>
        <span><i className="lg-booked" /> 내 예약 (클릭해 재방문)</span>
        <span><Wind size={11} /> 날개 구역</span>
      </div>
    </div>
  );
}
