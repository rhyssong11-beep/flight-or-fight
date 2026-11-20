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
        <h3>No seats booked yet</h3>
        <p>Choose an available seat in the 3D cabin or seat map and confirm your boarding pass to manage it here.</p>
        <button type="button" className="primary" onClick={onClose}>
          Explore seats <ArrowRight size={15} />
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
                Seat {seat.id} · {cabin.name}
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
                  title={`Open 3D view for seat ${seat.id}`}
                >
                  <Eye size={13} /> View
                </button>
                <button
                  type="button"
                  className="res-act cancel"
                  onClick={() => onCancelSeat(seat.id)}
                  title={`Cancel booking for seat ${seat.id}`}
                  aria-label={`Cancel seat ${seat.id}`}
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
          <small>{items.length} {items.length === 1 ? 'seat' : 'seats'} confirmed</small>
          <strong>Total {formatPrice(totalFare)}</strong>
        </div>
        <button type="button" className="clear-all-btn" onClick={onClearAll}>
          Release all
        </button>
      </div>
    </div>
  );
}
