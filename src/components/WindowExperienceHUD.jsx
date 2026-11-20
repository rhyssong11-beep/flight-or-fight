import React, { useState } from 'react';
import {
  Armchair,
  ArrowLeft,
  Camera,
  Compass,
  DoorClosed,
  DoorOpen,
  MapPin,
  Ruler,
  Snowflake,
  SunDim,
  Utensils,
  X,
} from 'lucide-react';
import { CABIN_BY_ID, ROUTE_WAYPOINTS, computeLegroomCm } from '../data/cabinData';

const DIM_LABELS = ['Clear', '25%', '50%', '75%', 'Tint'];

export default function WindowExperienceHUD({
  seat,
  env,
  seatbeltOn,
  dimLevel,
  onChangeDim,
  shutterPos,
  onChangeShutter,
  frostEnabled,
  onToggleFrost,
  seatMode,
  onChangeSeatMode,
  privacyDoorClosed,
  onTogglePrivacyDoor,
  heightCm,
  onChangeHeightCm,
  showLegroomRuler,
  onToggleLegroomRuler,
  onResetLook,
  onBackToCabin,
  onBackToOverview,
  onSavePostcard,
}) {
  const [activeDrawer, setActiveDrawer] = useState(null); // 'window' | 'comfort' | 'legroom' | 'ife' | null

  const cabin = CABIN_BY_ID[seat.cabin];
  const legroom = computeLegroomCm(seat, heightCm, seatMode !== 'upright');

  const toggleDrawer = (id) => {
    setActiveDrawer((prev) => (prev === id ? null : id));
    if (id === 'legroom' && activeDrawer !== 'legroom' && !showLegroomRuler) {
      onToggleLegroomRuler(true);
    }
  };

  return (
    <>
      {/* Always-accessible Top-Left Back & Look Controls (stays visible even when Hide pass is active!) */}
      <div className="pov-top-bar">
        <button type="button" className="hud-pill" onClick={onBackToCabin} title={`Return to ${cabin.name}`}>
          <ArrowLeft size={13} aria-hidden="true" /> {cabin.short}
        </button>
        <button type="button" className="hud-pill subtle" onClick={onBackToOverview} title="Aircraft overview">
          Overview
        </button>
        <button type="button" className="hud-pill subtle" onClick={onResetLook} title="Re-center 360° camera">
          <Compass size={13} aria-hidden="true" /> Center
        </button>
        <button type="button" className="hud-pill subtle" onClick={onSavePostcard} title="Capture window view postcard">
          <Camera size={13} aria-hidden="true" />
        </button>
      </div>

      {/* Top-left controls remain visible even when Hide pass is active */}

      {/* Compact Popover Drawer for selected seat experience tool */}
      {activeDrawer && (
        <div className="pov-drawer" role="region" aria-label="Seat experience controls">
          <div className="pov-drawer-head">
            <strong>
              {activeDrawer === 'window' && 'Window Shade, Dimmer & -54°C Frost'}
              {activeDrawer === 'comfort' && `${cabin.name} Seat Kinematics`}
              {activeDrawer === 'legroom' && `3D Legroom Fit · Seat ${seat.id}`}
              {activeDrawer === 'ife' && `In-Flight Map & ${cabin.short} Dining`}
            </strong>
            <button
              type="button"
              className="pov-drawer-close"
              onClick={() => setActiveDrawer(null)}
              aria-label="Close panel"
            >
              <X size={14} />
            </button>
          </div>

          {activeDrawer === 'window' && (
            <div className="pov-drawer-body">
              <div className="control-row">
                <span className="ctrl-label">Electrochromic Tint</span>
                <div className="seg-group">
                  {DIM_LABELS.map((lbl, idx) => (
                    <button
                      key={lbl}
                      type="button"
                      className={dimLevel === idx ? 'active' : ''}
                      onClick={() => onChangeDim(idx)}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="control-row">
                <span className="ctrl-label">
                  Physical Shade <b>{Math.round(shutterPos * 100)}%</b>
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(shutterPos * 100)}
                  onChange={(e) => onChangeShutter(Number(e.target.value) / 100)}
                  aria-label="Physical window shade position"
                />
              </div>

              <div className="control-row inline-toggle">
                <span className="ctrl-label">
                  <Snowflake size={13} aria-hidden="true" /> High-Altitude Window Frost ({env.baseTemp}°C)
                </span>
                <button
                  type="button"
                  className={`mini-toggle${frostEnabled ? ' on' : ''}`}
                  onClick={onToggleFrost}
                  aria-pressed={frostEnabled}
                >
                  {frostEnabled ? 'Active' : 'Off'}
                </button>
              </div>
            </div>
          )}

          {activeDrawer === 'comfort' && (
            <div className="pov-drawer-body">
              <div className="control-row">
                <span className="ctrl-label">Seat Position ({cabin.reclineLabel})</span>
                <div className="seg-group">
                  <button
                    type="button"
                    className={seatMode === 'upright' ? 'active' : ''}
                    onClick={() => onChangeSeatMode('upright')}
                  >
                    Upright
                  </button>
                  <button
                    type="button"
                    className={seatMode === 'lounge' ? 'active' : ''}
                    onClick={() => onChangeSeatMode('lounge')}
                  >
                    {cabin.canLieFlat ? 'Lounge' : 'Recline'}
                  </button>
                  {cabin.canLieFlat && (
                    <button
                      type="button"
                      className={seatMode === 'flat' ? 'active' : ''}
                      onClick={() => onChangeSeatMode('flat')}
                    >
                      180° Lie-Flat
                    </button>
                  )}
                </div>
              </div>

              {cabin.hasPrivacyDoor && (
                <div className="control-row inline-toggle">
                  <span className="ctrl-label">
                    {privacyDoorClosed ? <DoorClosed size={14} /> : <DoorOpen size={14} />}
                    Suite Privacy Sliding Door
                  </span>
                  <button
                    type="button"
                    className={`mini-toggle${privacyDoorClosed ? ' on' : ''}`}
                    onClick={onTogglePrivacyDoor}
                    aria-pressed={privacyDoorClosed}
                  >
                    {privacyDoorClosed ? 'Closed' : 'Open'}
                  </button>
                </div>
              )}

              <p className="ctrl-hint">
                Drag directly on the 3D scene to look 360° around your {cabin.short.toLowerCase()} space, overhead starry ceiling, and wing view.
              </p>
            </div>
          )}

          {activeDrawer === 'legroom' && (
            <div className="pov-drawer-body">
              <div className="control-row">
                <span className="ctrl-label">
                  Your Height <b>{heightCm} cm</b> ({Math.floor(heightCm / 30.48)}&apos;
                  {Math.round((heightCm % 30.48) / 2.54)}&quot;)
                </span>
                <input
                  type="range"
                  min={155}
                  max={200}
                  value={heightCm}
                  onChange={(e) => onChangeHeightCm(Number(e.target.value))}
                  aria-label="Passenger height in centimeters"
                />
              </div>

              <div className={`legroom-meter tone-${legroom.tone}`}>
                <div>
                  <small>Estimated Knee Clearance</small>
                  <strong>+{legroom.clearanceCm} cm · {legroom.rating}</strong>
                </div>
                <div className="legroom-spec-col">
                  <small>Seat Pitch</small>
                  <span>{seat.pitchInches}&quot; ({legroom.pitchCm} cm)</span>
                </div>
              </div>

              <div className="control-row inline-toggle">
                <span className="ctrl-label">3D Floor & Knee Dimension Guide</span>
                <button
                  type="button"
                  className={`mini-toggle${showLegroomRuler ? ' on' : ''}`}
                  onClick={() => onToggleLegroomRuler(!showLegroomRuler)}
                  aria-pressed={showLegroomRuler}
                >
                  {showLegroomRuler ? 'Visible' : 'Hidden'}
                </button>
              </div>
            </div>
          )}

          {activeDrawer === 'ife' && (
            <div className="pov-drawer-body ife-panel">
              <div className="ife-map-card">
                <div className="ife-map-meta">
                  <span>
                    <MapPin size={12} aria-hidden="true" /> {env.currentWaypoint.label}
                  </span>
                  <small>{env.currentWaypoint.region}</small>
                </div>
                <svg viewBox="0 0 240 92" className="ife-route-svg" aria-label="Great circle polar flight path from DXB to LAX">
                  <defs>
                    <linearGradient id="routeGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#d4af6a" />
                      <stop offset="55%" stopColor="#65d6ad" />
                      <stop offset="100%" stopColor="#e8ba78" />
                    </linearGradient>
                  </defs>
                  {/* Subtle latitude grid */}
                  <line x1="10" y1="22" x2="230" y2="22" stroke="#ffffff18" strokeDasharray="3 3" />
                  <line x1="10" y1="50" x2="230" y2="50" stroke="#ffffff14" strokeDasharray="3 3" />
                  <line x1="10" y1="74" x2="230" y2="74" stroke="#ffffff14" strokeDasharray="3 3" />
                  {/* Polar great-circle arc */}
                  <path
                    d={`M ${ROUTE_WAYPOINTS.map((w) => `${(w.xPct / 100) * 240} ${(w.yPct / 100) * 92}`).join(' L ')}`}
                    fill="none"
                    stroke="url(#routeGrad)"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                  {ROUTE_WAYPOINTS.map((w) => (
                    <circle
                      key={w.label}
                      cx={(w.xPct / 100) * 240}
                      cy={(w.yPct / 100) * 92}
                      r="2.2"
                      fill="#f5dfb4"
                      opacity="0.7"
                    />
                  ))}
                  {/* Live aircraft marker */}
                  <circle
                    cx={(env.mapX / 100) * 240}
                    cy={(env.mapY / 100) * 92}
                    r="5.2"
                    fill="#ffe08c"
                    stroke="#1c2430"
                    strokeWidth="2"
                  />
                  <text x="16" y="84" fill="#d9cfb8" fontSize="8" fontWeight="600">DXB</text>
                  <text x="115" y="13" fill="#7be8c1" fontSize="7" fontWeight="600">ARCTIC CIRCLE</text>
                  <text x="206" y="84" fill="#d9cfb8" fontSize="8" fontWeight="600">LAX</text>
                </svg>
                <div className="ife-map-foot">
                  <span>Elapsed {env.elapsedLabel}</span>
                  <span>IFE · {cabin.ifeSize}</span>
                  <span>Remaining {env.remainingLabel}</span>
                </div>
              </div>

              <div className="ife-menu-grid">
                <div>
                  <small>Welcome</small>
                  <p>{cabin.menu.welcome}</p>
                </div>
                <div>
                  <small>Signature Main</small>
                  <p>{cabin.menu.main}</p>
                </div>
                <div>
                  <small>Starter</small>
                  <p>{cabin.menu.starter}</p>
                </div>
                <div>
                  <small>Dessert</small>
                  <p>{cabin.menu.dessert}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bottom-Left Compact Seat Experience Dock */}
      <div className="pov-dock" role="toolbar" aria-label="In-seat interactive features">
        <button
          type="button"
          className={`dock-btn${activeDrawer === 'window' || dimLevel > 0 || shutterPos > 0.05 || frostEnabled ? ' active' : ''}`}
          onClick={() => toggleDrawer('window')}
        >
          <SunDim size={14} aria-hidden="true" /> Window
        </button>
        <button
          type="button"
          className={`dock-btn${activeDrawer === 'comfort' || seatMode !== 'upright' || privacyDoorClosed ? ' active' : ''}`}
          onClick={() => toggleDrawer('comfort')}
        >
          <Armchair size={14} aria-hidden="true" />
          {seatMode === 'flat' ? '180° Bed' : seatMode === 'lounge' ? 'Reclined' : 'Recline'}
        </button>
        <button
          type="button"
          className={`dock-btn${activeDrawer === 'legroom' || showLegroomRuler ? ' active' : ''}`}
          onClick={() => toggleDrawer('legroom')}
        >
          <Ruler size={14} aria-hidden="true" /> Legroom
        </button>
        <button
          type="button"
          className={`dock-btn${activeDrawer === 'ife' ? ' active' : ''}`}
          onClick={() => toggleDrawer('ife')}
        >
          <Utensils size={14} aria-hidden="true" /> IFE &amp; Menu
        </button>
      </div>
    </>
  );
}
