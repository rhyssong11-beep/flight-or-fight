import React, { useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  Plane,
  Ticket,
  Volume2,
  X,
} from 'lucide-react';
import { CABINS, formatPrice } from '../data/cabinData';

export default function BoardingPass({
  seat,
  booked,
  effectiveDb,
  env,
  onBook,
  onCancelBooking,
  onBack,
  onNext,
  onSavePostcard,
}) {
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, fx: 50, fy: 35, active: false });

  const cabinIdx = CABINS.findIndex((c) => c.id === seat.cabin);
  const cabin = CABINS[cabinIdx];
  const nextCabin = CABINS[(cabinIdx + 1) % CABINS.length];

  const handleMouseMove = (e) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    setTilt({
      rx: (0.5 - ny) * 7,
      ry: (nx - 0.5) * 8,
      fx: nx * 100,
      fy: ny * 100,
      active: true,
    });
  };

  const handleMouseLeave = () => {
    setTilt({ rx: 0, ry: 0, fx: 50, fy: 35, active: false });
  };

  return (
    <div className="pass-stage">
      <section
        ref={cardRef}
        className={`flight-pass${booked ? ' is-confirmed' : ''}${tilt.active ? ' is-tilting' : ''}`}
        aria-label={`Boarding pass for seat ${seat.id}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          '--rx': `${tilt.rx.toFixed(2)}deg`,
          '--ry': `${tilt.ry.toFixed(2)}deg`,
          '--foil-x': `${tilt.fx.toFixed(1)}%`,
          '--foil-y': `${tilt.fy.toFixed(1)}%`,
        }}
      >
        <div className="foil-sheen" aria-hidden="true" />

        <div className="flight-pass-body">
          <header className="flight-pass-heading">
            <span>
              <Ticket size={15} strokeWidth={1.6} aria-hidden="true" /> Boarding pass
            </span>
            <span className="flight-pass-flight">EK215 · B777-300ER</span>
          </header>

          <div className="flight-pass-tags">
            <span className="flight-pass-cabin">{cabin.name}</span>
            <span className="flight-pass-spec">{seat.pitchInches}&quot; pitch</span>
            <span className="flight-pass-spec">
              <Volume2 size={11} aria-hidden="true" /> {effectiveDb} dB
            </span>
          </div>

          <div className="flight-pass-route">
            <div className="flight-pass-stop">
              <strong>DXB</strong>
              <span>
                Dubai <b>09:40</b>
              </span>
            </div>
            <div className="flight-pass-journey">
              <div className="flight-pass-track">
                <i />
                <Plane size={16} strokeWidth={1.5} aria-hidden="true" />
                <i />
              </div>
              <small>{env.remainingLabel} left</small>
            </div>
            <div className="flight-pass-stop">
              <strong>LAX</strong>
              <span>
                Los Angeles <b>13:55</b>
              </span>
            </div>
          </div>

          <dl className="flight-pass-fields">
            <div>
              <dt>Passenger</dt>
              <dd>You</dd>
            </div>
            <div>
              <dt>Seat</dt>
              <dd>{seat.id}</dd>
            </div>
            <div>
              <dt>Gate</dt>
              <dd>B12</dd>
            </div>
            <div>
              <dt>Boarding</dt>
              <dd>07:55</dd>
            </div>
          </dl>
        </div>

        <div className="flight-pass-stub">
          <div className="flight-pass-sale">
            <div className="flight-pass-total">
              <span>Total fare</span>
              <strong>{formatPrice(cabin.price)}</strong>
            </div>

            {booked ? (
              <div className="booked-actions">
                <button type="button" className="flight-pass-book is-booked" disabled>
                  <Check size={15} aria-hidden="true" /> Booked
                </button>
                <button
                  type="button"
                  className="flight-pass-unbook"
                  onClick={onCancelBooking}
                  title="Release this seat"
                  aria-label={`Cancel booking for seat ${seat.id}`}
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </div>
            ) : (
              <button type="button" className="flight-pass-book" onClick={onBook}>
                Book {seat.id} <ArrowRight size={14} aria-hidden="true" />
              </button>
            )}
          </div>

          <span role="status" className="flight-pass-a11y">
            {booked ? `Booking confirmed for seat ${seat.id}.` : ''}
          </span>

          <div className="flight-pass-extra-row">
            <button type="button" className="postcard-cta" onClick={onSavePostcard}>
              <Camera size={13} aria-hidden="true" /> Save Window Postcard (PNG)
            </button>
          </div>

          <nav className="flight-pass-links" aria-label="Explore more seats">
            <button type="button" onClick={onBack}>
              <ArrowLeft size={13} aria-hidden="true" /> All Seats
            </button>
            <button type="button" onClick={onNext}>
              See {nextCabin.short} <ArrowRight size={13} aria-hidden="true" />
            </button>
          </nav>
        </div>
      </section>
    </div>
  );
}
