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

  // Build CSS grid template reflecting exact aisle gaps (e.g. 1-2-1, 2-3-2, 3-4-3)
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
    const parts = ['26px']; // Row number column
    columnsWithAisles.forEach((c) => {
      parts.push(c.kind === 'aisle' ? '14px' : 'minmax(0, 1fr)');
    });
    return parts.join(' ');
  }, [columnsWithAisles]);

  const leftTag = env.sunSide === 'aurora' ? 'AURORA' : env.sunSide === 'port' ? 'SUN (A)' : 'SHADE (A)';
  const rightTag = env.sunSide === 'aurora' ? 'AURORA' : env.sunSide === 'starboard' ? 'SUN (K)' : 'SHADE (K)';

  return (
    <div className="seatmap-modal">
      <div className="list-select">
        <label htmlFor="cabin-choice">Cabin class</label>
        <select
          id="cabin-choice"
          value={cabin.id}
          onChange={(e) => onChangeCabin(e.target.value)}
        >
          {CABINS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.layout}) · {formatPrice(c.price)}
            </option>
          ))}
        </select>
      </div>

      {/* Sun / Shade / Layout orientation strip */}
      <div className="seatmap-orient">
        <span className={env.sunSide === 'port' ? 'is-sun' : ''}>
          {env.sunSide === 'aurora' ? <Sparkles size={11} /> : <Sun size={11} />} {leftTag}
        </span>
        <span className="orient-center">{cabin.layout} CONFIGURATION · FRONT ▲</span>
        <span className={env.sunSide === 'starboard' ? 'is-sun' : ''}>
          {rightTag} {env.sunSide === 'aurora' ? <Sparkles size={11} /> : <Sun size={11} />}
        </span>
      </div>

      {/* Column Letter Headers */}
      <div className="seatmap-header" style={{ gridTemplateColumns: gridTemplate }}>
        <span className="row-num-hd">Row</span>
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

      {/* True-to-aircraft rows with aisle corridors, exit row badges & wing zone indicators */}
      <div className="seatmap-rows" role="list">
        {rows.map(([rowNum, rowSeats]) => {
          const isExit = rowSeats[0]?.isExitRow;
          const isWing = rowSeats[0]?.isOverWing;
          return (
            <React.Fragment key={rowNum}>
              {isExit && (
                <div className="exit-divider">
                  <span>◄ EXIT ROW · EXTRA LEGROOM (38&quot;)</span>
                  <span>EXIT ►</span>
                </div>
              )}
              <div
                className={`seatmap-row${isWing ? ' over-wing' : ''}`}
                style={{ gridTemplateColumns: gridTemplate }}
                role="listitem"
              >
                <span className="row-num" title={isWing ? `Row ${rowNum} (Over-wing)` : `Row ${rowNum}`}>
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
                      aria-label={`Seat ${seat.id}, ${seat.positionType}, ${
                        isBooked ? 'booked by you, select to view' : isDisabled ? 'occupied' : 'available'
                      }`}
                      title={`Seat ${seat.id} · ${seat.viewLabel} · ${seat.noiseDb} dB`}
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
        <span><i className="lg-avail" /> Available</span>
        <span><i className="lg-occ" /> Occupied</span>
        <span><i className="lg-booked" /> Booked (click to view)</span>
        <span><Wind size={11} /> Wing zone</span>
      </div>
    </div>
  );
}
