import React, { useEffect, useRef, useState } from 'react';
import {
  Clock3,
  Footprints,
  Gauge,
  Headphones,
  Keyboard,
  MousePointer2,
  Mountain,
  Plane,
  ScanLine,
  Sparkles,
  Thermometer,
  X,
} from 'lucide-react';

export function AerisBrand() {
  return (
    <div className="brand" aria-label="Aeris">
      <svg viewBox="0 0 44 36" aria-hidden="true">
        <g fill="currentColor">
          <path d="M1 4h42L32 12H13z" />
          <path d="M11 15h18l-9 7z" />
          <path d="m19 25 12-9-6 15z" />
        </g>
      </svg>
      AERIS
    </div>
  );
}

export function RouteBadge() {
  return (
    <div className="route">
      <div>
        <strong>DXB</strong>
        <small>Dubai</small>
      </div>
      <span className="airline">
        <i />
        <Plane size={17} fill="currentColor" />
        <i />
      </span>
      <div>
        <strong>LAX</strong>
        <small>Los Angeles</small>
      </div>
    </div>
  );
}

export function TelemetryStrip({ env, turbulenceLevel }) {
  const [jitter, setJitter] = useState({ alt: 0, spd: 0, tmp: 0 });

  useEffect(() => {
    const id = setInterval(() => {
      const scale = 1 + turbulenceLevel * 7;
      setJitter({
        alt: Math.round((Math.random() - 0.5) * 40 * scale),
        spd: Math.round((Math.random() - 0.5) * 3 * scale),
        tmp: turbulenceLevel > 0.4 ? Math.round((Math.random() - 0.5) * 2) : 0,
      });
    }, 1400);
    return () => clearInterval(id);
  }, [turbulenceLevel]);

  const alt = (env.baseAltitude + jitter.alt).toLocaleString();
  const spd = env.baseSpeed + jitter.spd;
  const tmp = env.baseTemp + jitter.tmp;

  const readings = [
    { icon: <Mountain />, title: 'Altitude', value: alt, unit: 'ft' },
    { icon: <Gauge />, title: 'Ground speed', value: String(spd), unit: 'mph' },
    { icon: <Thermometer />, title: 'Outside temp.', value: `−${Math.abs(tmp)}`, unit: '°C' },
    { icon: <Clock3 />, title: 'Time remaining', value: env.remainingLabel, unit: '' },
  ];

  return (
    <div className="telemetry">
      {readings.map(({ icon, title, value, unit }) => (
        <div className="reading" key={title}>
          <div className="reading-icon">{icon}</div>
          <div>
            <small>{title}</small>
            <strong>
              {value} <em>{unit}</em>
            </strong>
          </div>
        </div>
      ))}
    </div>
  );
}

export function DialogPanel({ title, close, wide = false, children }) {
  const ref = useRef(null);

  useEffect(() => {
    const dlg = ref.current;
    dlg?.showModal();
    return () => dlg?.close();
  }, []);

  return (
    <dialog
      className={`panel${wide ? ' panel-wide' : ''}`}
      aria-label={title}
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => {
        if (e.target === ref.current) close();
      }}
    >
      <div className="panel-inner">
        <header>
          <h2>{title}</h2>
          <button type="button" className="square" onClick={close} aria-label="Close dialog">
            <X size={18} />
          </button>
        </header>
        {children}
      </div>
    </dialog>
  );
}

export function FlightDetailsContent({ env }) {
  const rows = [
    ['Aircraft', 'Boeing 777-300ER · Reg. A6-AER'],
    ['Departure', 'Dubai (DXB) · 09:40 GST'],
    ['Arrival', 'Los Angeles (LAX) · 13:55 PST'],
    ['Flight time', '16h 15m · Nonstop Polar Track'],
    ['Current sector', `${env.currentWaypoint.label} (${env.currentWaypoint.region})`],
    ['Gate / boarding', 'Terminal 3 · Gate B12 · 07:55'],
  ];
  return (
    <>
      <div className="flight-label">
        <Plane size={16} /> Flight EK215 · Boeing 777-300ER
      </div>
      <RouteBadge />
      <dl className="details-table">
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}

export function ExplorerGuideContent() {
  const tips = [
    [
      <MousePointer2 key="m" />,
      '3D Hover & X-Ray Seat Finder',
      'Hover over any 3D seat to check its price, noise dB, and availability. Use the Seat Finder chips to highlight quiet, wing-view, or shade-side seats in gold.',
    ],
    [
      <ScanLine key="s" />,
      '360° Seat View, Shades & Recline',
      'Select a seat to step inside. Drag anywhere to look 360°, lower the physical window blind or electrochromic tint, test 180° Lie-Flat recline, and measure legroom for your height.',
    ],
    [
      <Sparkles key="a" />,
      '16h Polar Sky, Aurora & Weather',
      'Scrub the Flight Timeline through Morning, Stratosphere Noon, Arctic Aurora (with Starry Ceiling), and Golden Hour—or trigger Storm turbulence for live Wing Flex & seatbelt chimes.',
    ],
    [
      <Headphones key="h" />,
      'Spatial Cabin Audio & ANC',
      'Enable Cabin Acoustics to hear how GE90 engine sound shifts by seat position, then toggle ANC ON to experience active noise cancellation.',
    ],
    [
      <Footprints key="w" />,
      'Aisle Walkthrough & Keyboard Access',
      'Click "Walk the Cabin" for a first-person stroll from First Suite to Economy, or open Seat list for a true 1-2-1 / 2-3-2 / 3-4-3 seat map.',
    ],
    [
      <Keyboard key="k" />,
      'Shortcuts',
      'Press Escape to exit dialogs, expanded view, or return to aircraft overview.',
    ],
  ];

  return (
    <div className="guide">
      {tips.map(([icon, title, desc], i) => (
        <div key={i}>
          {icon}
          <div>
            <h3>{title}</h3>
            <p>{desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
