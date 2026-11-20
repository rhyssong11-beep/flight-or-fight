import React, { useState } from 'react';
import {
  Armchair,
  ArrowLeft,
  Camera,
  DoorClosed,
  DoorOpen,
  Eye,
  MapPin,
  Ruler,
  Snowflake,
  Sparkles,
  SunDim,
  Utensils,
  X,
} from 'lucide-react';
import { CABIN_BY_ID, ROUTE_WAYPOINTS, computeLegroomCm } from '../data/cabinData';

const DIM_LABELS = ['투명', '25%', '50%', '75%', '차광'];

export default function WindowExperienceHUD({
  seat,
  env,
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
  activeLookDir,
  onSelectLookDir,
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

  const lookButtons = [
    { id: 'left', label: '좌측 창문(A)' },
    { id: 'front', label: '기내 정면' },
    { id: 'right', label: '우측 창문(K)' },
    { id: 'ceiling', label: '천장' },
  ];

  return (
    <>
      {/* Top-left persistent navigation + 360° Quick Look Controls (Left Window <-> Cabin <-> Opposite Window!) */}
      <div className="pov-top-bar">
        <button type="button" className="hud-pill" onClick={onBackToCabin} title={`${cabin.name}로 돌아가기`}>
          <ArrowLeft size={13} aria-hidden="true" /> {cabin.short}
        </button>
        <button type="button" className="hud-pill subtle" onClick={onBackToOverview} title="기체 전체 보기">
          전체 기체
        </button>

        <div className="look-switcher" role="group" aria-label="360도 시야 방향 전환">
          <Eye size={12} className="look-ic" aria-hidden="true" />
          {lookButtons.map((btn) => (
            <button
              key={btn.id}
              type="button"
              className={activeLookDir === btn.id ? 'active' : ''}
              onClick={() => onSelectLookDir(btn.id)}
              title={`${btn.label} 방향 바라보기 (드래그로도 360° 자유 회전)`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="hud-pill subtle"
          onClick={onSavePostcard}
          title="현재 3D 시야 엽서(PNG)로 저장"
          aria-label="현재 3D 시야 엽서로 저장"
        >
          <Camera size={13} aria-hidden="true" />
        </button>
      </div>

      {/* Compact Popover Drawer for selected seat experience tool */}
      {activeDrawer && (
        <div className="pov-drawer" role="region" aria-label="좌석 체험 설정">
          <div className="pov-drawer-head">
            <strong>
              {activeDrawer === 'window' && '창문 블라인드 · 전자식 조광 · 성층권 성애'}
              {activeDrawer === 'comfort' && `${cabin.name} 좌석 리클라이닝`}
              {activeDrawer === 'legroom' && `3D 레그룸 측정 · ${seat.id} 좌석`}
              {activeDrawer === 'ife' && `실시간 항로 지도 & ${cabin.short} 기내식`}
            </strong>
            <button
              type="button"
              className="pov-drawer-close"
              onClick={() => setActiveDrawer(null)}
              aria-label="패널 닫기"
            >
              <X size={14} />
            </button>
          </div>

          {activeDrawer === 'window' && (
            <div className="pov-drawer-body">
              <div className="control-row">
                <span className="ctrl-label">5단계 전자식 조광 유리 (양측 창문 연동)</span>
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
                  물리 창문 셔터 <b>{Math.round(shutterPos * 100)}%</b>
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(shutterPos * 100)}
                  onChange={(e) => onChangeShutter(Number(e.target.value) / 100)}
                  aria-label="물리 창문 셔터 높이"
                />
              </div>

              <div className="control-row inline-toggle">
                <span className="ctrl-label">
                  <Snowflake size={13} aria-hidden="true" /> 고고도 창문 결빙 성애 ({env.baseTemp}°C)
                </span>
                <button
                  type="button"
                  className={`mini-toggle${frostEnabled ? ' on' : ''}`}
                  onClick={onToggleFrost}
                  aria-pressed={frostEnabled}
                >
                  {frostEnabled ? '켜짐' : '꺼짐'}
                </button>
              </div>
            </div>
          )}

          {activeDrawer === 'comfort' && (
            <div className="pov-drawer-body">
              <div className="control-row">
                <span className="ctrl-label">좌석 각도 ({cabin.reclineLabel})</span>
                <div className="seg-group">
                  <button
                    type="button"
                    className={seatMode === 'upright' ? 'active' : ''}
                    onClick={() => onChangeSeatMode('upright')}
                  >
                    정자세
                  </button>
                  <button
                    type="button"
                    className={seatMode === 'lounge' ? 'active' : ''}
                    onClick={() => onChangeSeatMode('lounge')}
                  >
                    {cabin.canLieFlat ? '라운지' : '리클라이닝'}
                  </button>
                  {cabin.canLieFlat && (
                    <button
                      type="button"
                      className={seatMode === 'flat' ? 'active' : ''}
                      onClick={() => onChangeSeatMode('flat')}
                    >
                      180° 풀플랫
                    </button>
                  )}
                </div>
              </div>

              {cabin.hasPrivacyDoor && (
                <div className="control-row inline-toggle">
                  <span className="ctrl-label">
                    {privacyDoorClosed ? <DoorClosed size={14} /> : <DoorOpen size={14} />}
                    퍼스트 스위트 프라이버시 도어
                  </span>
                  <button
                    type="button"
                    className={`mini-toggle${privacyDoorClosed ? ' on' : ''}`}
                    onClick={onTogglePrivacyDoor}
                    aria-pressed={privacyDoorClosed}
                  >
                    {privacyDoorClosed ? '닫힘' : '열림'}
                  </button>
                </div>
              )}

              <p className="ctrl-hint">
                3D 화면을 드래그하거나 상단 시점 버튼으로 좌측 창문(A)부터 기내 통로, 반대쪽 우측 창문(K)과 별빛 천장까지 360° 자유롭게 둘러볼 수 있습니다.
              </p>
            </div>
          )}

          {activeDrawer === 'legroom' && (
            <div className="pov-drawer-body">
              <div className="control-row">
                <span className="ctrl-label">
                  내 키 설정 <b>{heightCm} cm</b>
                </span>
                <input
                  type="range"
                  min={155}
                  max={200}
                  value={heightCm}
                  onChange={(e) => onChangeHeightCm(Number(e.target.value))}
                  aria-label="탑승객 키 설정 (cm)"
                />
              </div>

              <div className={`legroom-meter tone-${legroom.tone}`}>
                <div>
                  <small>예상 무릎 여유 공간</small>
                  <strong>+{legroom.clearanceCm} cm · {legroom.rating}</strong>
                </div>
                <div className="legroom-spec-col">
                  <small>좌석 피치</small>
                  <span>{seat.pitchInches}&quot; ({legroom.pitchCm} cm)</span>
                </div>
              </div>

              <div className="control-row inline-toggle">
                <span className="ctrl-label">3D 바닥 · 무릎 치수선 표시</span>
                <button
                  type="button"
                  className={`mini-toggle${showLegroomRuler ? ' on' : ''}`}
                  onClick={() => onToggleLegroomRuler(!showLegroomRuler)}
                  aria-pressed={showLegroomRuler}
                >
                  {showLegroomRuler ? '표시 중' : '숨김'}
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
                <svg viewBox="0 0 240 92" className="ife-route-svg" aria-label="두바이에서 로스앤젤레스 북극 대권 항로 지도">
                  <defs>
                    <linearGradient id="routeGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#d4af6a" />
                      <stop offset="55%" stopColor="#65d6ad" />
                      <stop offset="100%" stopColor="#e8ba78" />
                    </linearGradient>
                  </defs>
                  <line x1="10" y1="22" x2="230" y2="22" stroke="#ffffff18" strokeDasharray="3 3" />
                  <line x1="10" y1="50" x2="230" y2="50" stroke="#ffffff14" strokeDasharray="3 3" />
                  <line x1="10" y1="74" x2="230" y2="74" stroke="#ffffff14" strokeDasharray="3 3" />
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
                  <circle
                    cx={(env.mapX / 100) * 240}
                    cy={(env.mapY / 100) * 92}
                    r="5.2"
                    fill="#ffe08c"
                    stroke="#1c2430"
                    strokeWidth="2"
                  />
                  <text x="16" y="84" fill="#d9cfb8" fontSize="8" fontWeight="600">DXB</text>
                  <text x="115" y="13" fill="#7be8c1" fontSize="7" fontWeight="600">북극 항로</text>
                  <text x="206" y="84" fill="#d9cfb8" fontSize="8" fontWeight="600">LAX</text>
                </svg>
                <div className="ife-map-foot">
                  <span>경과 {env.elapsedLabel}</span>
                  <span>IFE · {cabin.ifeSize}</span>
                  <span>잔여 {env.remainingLabel}</span>
                </div>
              </div>

              <div className="ife-menu-grid">
                <div>
                  <small>웰컴 서비스</small>
                  <p>{cabin.menu.welcome}</p>
                </div>
                <div>
                  <small>시그니처 메인</small>
                  <p>{cabin.menu.main}</p>
                </div>
                <div>
                  <small>에피타이저</small>
                  <p>{cabin.menu.starter}</p>
                </div>
                <div>
                  <small>디저트</small>
                  <p>{cabin.menu.dessert}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bottom-Left Compact Seat Experience Dock */}
      <div className="pov-dock" role="toolbar" aria-label="좌석 내 인터랙션 도구">
        <button
          type="button"
          className={`dock-btn${activeDrawer === 'window' || dimLevel > 0 || shutterPos > 0.05 || frostEnabled ? ' active' : ''}`}
          onClick={() => toggleDrawer('window')}
        >
          <SunDim size={14} aria-hidden="true" /> 창문 · 성애
        </button>
        <button
          type="button"
          className={`dock-btn${activeDrawer === 'comfort' || seatMode !== 'upright' || privacyDoorClosed ? ' active' : ''}`}
          onClick={() => toggleDrawer('comfort')}
        >
          <Armchair size={14} aria-hidden="true" />
          {seatMode === 'flat' ? '180° 베드' : seatMode === 'lounge' ? '리클라이닝 중' : '리클라이닝'}
        </button>
        <button
          type="button"
          className={`dock-btn${activeDrawer === 'legroom' || showLegroomRuler ? ' active' : ''}`}
          onClick={() => toggleDrawer('legroom')}
        >
          <Ruler size={14} aria-hidden="true" /> 레그룸
        </button>
        <button
          type="button"
          className={`dock-btn${activeDrawer === 'ife' ? ' active' : ''}`}
          onClick={() => toggleDrawer('ife')}
        >
          <Utensils size={14} aria-hidden="true" /> 항로 · 기내식
        </button>
        <button
          type="button"
          className="dock-btn opposite-shortcut"
          onClick={() => onSelectLookDir(activeLookDir === 'right' ? 'left' : 'right')}
          title="반대쪽 창문 바라보기"
        >
          <Sparkles size={13} aria-hidden="true" /> 반대 창문
        </button>
      </div>
    </>
  );
}
