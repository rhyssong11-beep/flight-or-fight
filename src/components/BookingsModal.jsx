import React from 'react';
import { ArrowRight, Check, Eye, Ticket, Trash2 } from 'lucide-react';
import { CABIN_BY_ID, SEAT_BY_ID, formatPrice } from '../data/cabinData';

export default function BookingsModal({
  booked,
  onVisitSeat,
  onCancelSeat,
  onClearAll,
  onClose,
}) {
  if (!booked.length) {
    return (
      <div className="empty">
        <Ticket size={28} strokeWidth={1.5} />
        <h3>아직 예약한 좌석이 없습니다</h3>
        <p>3D 객실 또는 좌석 배치도에서 원하는 좌석을 선택해 탑승권을 확정하면 여기에서 관리할 수 있습니다.</p>
        <button type="button" className="primary" onClick={onClose}>
          좌석 둘러보기 <ArrowRight size={15} />
        </button>
      </div>
    );
  }

  const items = booked
    .map((id) => {
      const seat = SEAT_BY_ID[id];
      if (!seat) return null;
      return { seat, cabin: CABIN_BY_ID[seat.cabin] };
    })
    .filter(Boolean);

  const totalFare = items.reduce((sum, item) => sum + item.cabin.price, 0);

  return (
    <div className="bookings-panel">
      <ul className="reservation-list">
        {items.map(({ seat, cabin }) => (
          <li key={seat.id}>
            <div className="res-icon">
              <Check size={15} />
            </div>
            <div className="res-info">
              <strong>
                {seat.id} 좌석 · {cabin.name}
              </strong>
              <small>
                EK215 · DXB → LAX · {seat.viewLabel}
              </small>
            </div>
            <div className="res-right">
              <b>{formatPrice(cabin.price)}</b>
              <div className="res-actions">
                <button
                  type="button"
                  className="res-act view"
                  onClick={() => onVisitSeat(seat)}
                  title={`${seat.id} 좌석 3D 시점으로 이동`}
                >
                  <Eye size={13} /> 3D 보기
                </button>
                <button
                  type="button"
                  className="res-act cancel"
                  onClick={() => onCancelSeat(seat.id)}
                  title={`${seat.id} 좌석 예약 취소`}
                  aria-label={`${seat.id} 좌석 예약 취소`}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="bookings-summary">
        <div>
          <small>총 {items.length}석 예약 확정</small>
          <strong>합계 {formatPrice(totalFare)}</strong>
        </div>
        <button type="button" className="clear-all-btn" onClick={onClearAll}>
          전체 취소
        </button>
      </div>
    </div>
  );
}
