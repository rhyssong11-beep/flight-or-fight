import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Armchair,
  AudioLines,
  ChevronRight,
  CircleHelp,
  Crosshair,
  Footprints,
  Layers,
  List,
  Maximize,
  Minus,
  MousePointer2,
  Pause,
  Plane,
  Play,
  Plus,
  Ticket,
  VolumeX,
  X,
} from 'lucide-react';
import AircraftScene from './scene/AircraftScene';
import BoardingPass from './components/BoardingPass';
import WindowExperienceHUD from './components/WindowExperienceHUD';
import FlightEnvironmentBar from './components/FlightEnvironmentBar';
import SmartSeatFinder from './components/SmartSeatFinder';
import SeatListModal from './components/SeatListModal';
import BookingsModal from './components/BookingsModal';
import PostcardModal from './components/PostcardModal';
import {
  AerisBrand,
  DialogPanel,
  ExplorerGuideContent,
  FlightDetailsContent,
  RouteBadge,
  TelemetryStrip,
} from './components/BrandAndIcons';
import {
  CABINS,
  CABIN_BY_ID,
  CABIN_IMAGES,
  LEGACY_STORAGE_KEY,
  SEATS,
  SEAT_BY_ID,
  STORAGE_KEY,
  WEATHER_MODES,
  formatPrice,
  getFlightEnvironment,
} from './data/cabinData';
import { cabinAudio } from './audio/cabinAudioEngine';
import { generateSouvenirPostcard } from './utils/postcardGenerator';

const OVERVIEW_TARGET = { kind: 'overview' };

function readStoredBookings() {
  try {
    const rawV2 = localStorage.getItem(STORAGE_KEY);
    const rawV1 = localStorage.getItem(LEGACY_STORAGE_KEY);
    const parsed = JSON.parse(rawV2 || rawV1 || '[]');
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.filter((id) => typeof id === 'string' && SEAT_BY_ID[id] && !SEAT_BY_ID[id].occupied))];
  } catch {
    return [];
  }
}

function writeStoredBookings(ids) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // ignore quota errors
  }
}

function ClassTitleOverlay({ cabinId }) {
  const idx = CABINS.findIndex((c) => c.id === cabinId);
  const cabin = CABINS[idx];
  if (!cabin) return null;
  return (
    <div className="class-title-stage" role="status">
      <div className="class-title">
        <small>
          클래스 {String(idx + 1).padStart(2, '0')} / {String(CABINS.length).padStart(2, '0')}
        </small>
        <strong>{cabin.name}</strong>
        <span>
          {cabin.layout} 배열 · 피치 {cabin.pitchInches}&quot; · {formatPrice(cabin.price)}~
        </span>
      </div>
    </div>
  );
}

export default function App() {
  const [phase, setPhase] = useState('overview');
  const [target, setTarget] = useState(OVERVIEW_TARGET);
  const targetRef = useRef(OVERVIEW_TARGET);
  const transitioningRef = useRef(false);

  const [booked, setBooked] = useState(readStoredBookings);
  const [modal, setModal] = useState(null);
  const [listCabin, setListCabin] = useState('first');
  const [postcardData, setPostcardData] = useState({ url: null, seatId: '' });

  const [hovered, setHovered] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [passVisible, setPassVisible] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [lookResetTick, setLookResetTick] = useState(0);
  const [lookPreset, setLookPreset] = useState(null);
  const [activeLookDir, setActiveLookDir] = useState('left');
  const canvasElRef = useRef(null);

  const [flightProgress, setFlightProgress] = useState(0.86);
  const [timePlaying, setTimePlaying] = useState(false);
  const [weatherId, setWeatherId] = useState('clear');

  const [audioEnabled, setAudioEnabled] = useState(false);
  const [ancEnabled, setAncEnabled] = useState(false);

  const [activeFilter, setActiveFilter] = useState(null);

  const [dimLevel, setDimLevel] = useState(0);
  const [shutterPos, setShutterPos] = useState(0);
  const [frostEnabled, setFrostEnabled] = useState(false);
  const [seatMode, setSeatMode] = useState('upright');
  const [privacyDoorClosed, setPrivacyDoorClosed] = useState(false);
  const [heightCm, setHeightCm] = useState(176);
  const [showLegroomRuler, setShowLegroomRuler] = useState(false);

  const [walkPaused, setWalkPaused] = useState(false);
  const [walkInfo, setWalkInfo] = useState({ progress: 0, cabinName: '퍼스트 스위트', x: -20.8 });

  const env = useMemo(() => getFlightEnvironment(flightProgress), [flightProgress]);
  const weather = useMemo(
    () => WEATHER_MODES.find((w) => w.id === weatherId) || WEATHER_MODES[0],
    [weatherId]
  );

  const activeCabinId =
    target.kind === 'class' ? target.cabin : target.kind === 'seat' ? target.seat.cabin : null;
  const activeCabin = activeCabinId ? CABIN_BY_ID[activeCabinId] : null;
  const selectedSeat = target.kind === 'seat' ? target.seat : null;

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY || e.key === null) setBooked(readStoredBookings());
    };
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
      cabinAudio.dispose();
    };
  }, []);

  useEffect(() => {
    if (!timePlaying) return;
    let rafId = 0;
    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      setFlightProgress((prev) => {
        const next = prev + dt * 0.036;
        return next > 1 ? 0 : next;
      });
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [timePlaying]);

  const currentSpatialSeat = useMemo(() => {
    if (target.kind === 'seat') {
      return { seatX: target.seat.x, noiseDb: target.seat.noiseDb };
    }
    if (target.kind === 'walkthrough') {
      const x = walkInfo.x;
      const d = Math.abs(x - -2.2);
      const db = Math.round((66 + Math.max(0, 1 - d / 16) * 8 + (x > 10 ? 4 : 0)) * 10) / 10;
      return { seatX: x, noiseDb: db };
    }
    if (target.kind === 'class' && activeCabin) {
      const midX = (activeCabin.start + activeCabin.end) / 2;
      const db =
        activeCabin.id === 'first' ? 62.5 : activeCabin.id === 'business' ? 67.2 : activeCabin.id === 'premium' ? 73.4 : 74.8;
      return { seatX: midX, noiseDb: db };
    }
    return { seatX: 0, noiseDb: 69.5 };
  }, [target, activeCabin, walkInfo.x]);

  useEffect(() => {
    cabinAudio.updateSpatialState({
      seatX: currentSpatialSeat.seatX,
      noiseDb: currentSpatialSeat.noiseDb,
      turbulence: weather.turbulence,
    });
  }, [currentSpatialSeat, weather.turbulence]);

  const effectiveDb = useMemo(() => {
    const turbDb = weather.turbulence * 5.4;
    const ancCut = ancEnabled ? -18.5 : 0;
    return Math.round((currentSpatialSeat.noiseDb + turbDb + ancCut) * 10) / 10;
  }, [currentSpatialSeat.noiseDb, weather.turbulence, ancEnabled]);

  const navigateTo = useCallback((nextTarget) => {
    if (transitioningRef.current) return;
    transitioningRef.current = true;
    targetRef.current = nextTarget;
    setHovered(null);
    setZoom(1);
    setPassVisible(true);
    setModal(null);
    setWalkPaused(false);
    setLookPreset(null);
    if (nextTarget.kind === 'seat') {
      setSeatMode('upright');
      setPrivacyDoorClosed(false);
      setShowLegroomRuler(false);
      setDimLevel(0);
      setShutterPos(0);
      setActiveLookDir(nextTarget.seat.z < 0 ? 'left' : 'right');
    }
    setPhase('transitioning');
    setTarget(nextTarget);
  }, []);

  const handleSettled = useCallback(() => {
    transitioningRef.current = false;
    const k = targetRef.current.kind;
    setPhase(
      k === 'seat'
        ? 'seat-pov'
        : k === 'class'
        ? 'class-view'
        : k === 'walkthrough'
        ? 'walkthrough'
        : 'overview'
    );
  }, []);

  const handleSelectSeat = useCallback(
    (seat) => {
      if (!seat) return;
      if (seat.occupied && !booked.includes(seat.id)) return;
      navigateTo({ kind: 'seat', seat });
    },
    [navigateTo, booked]
  );

  const handleHoverSeat = useCallback((seat, x, y) => {
    if (!seat || transitioningRef.current) {
      setHovered(null);
      return;
    }
    setHovered({ seat, x, y });
  }, []);

  const goOverview = useCallback(() => navigateTo(OVERVIEW_TARGET), [navigateTo]);

  const openSeatList = useCallback(() => {
    setListCabin(activeCabinId || 'first');
    setHovered(null);
    setModal('list');
  }, [activeCabinId]);

  const handleSelectLookDir = useCallback((dir) => {
    setActiveLookDir(dir);
    setLookPreset({ dir, tick: Date.now() + Math.random() });
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape' || modal) return;
      if (expanded) {
        setExpanded(false);
      } else if (phase === 'class-view' || phase === 'seat-pov' || phase === 'walkthrough') {
        navigateTo(OVERVIEW_TARGET);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [expanded, modal, phase, navigateTo]);

  const bookCurrentSeat = useCallback(() => {
    if (target.kind !== 'seat' || target.seat.occupied) return;
    const next = [...new Set([...booked, ...readStoredBookings(), target.seat.id])];
    writeStoredBookings(next);
    setBooked(next);
    cabinAudio.playBookingChime();
  }, [target, booked]);

  const cancelBooking = useCallback(
    (seatId) => {
      const next = booked.filter((id) => id !== seatId);
      writeStoredBookings(next);
      setBooked(next);
    },
    [booked]
  );

  const clearAllBookings = useCallback(() => {
    writeStoredBookings([]);
    setBooked([]);
  }, []);

  const handleToggleAudio = useCallback(async () => {
    const on = await cabinAudio.toggle();
    setAudioEnabled(on);
  }, []);

  const handleToggleAnc = useCallback(async () => {
    const next = !ancEnabled;
    setAncEnabled(next);
    cabinAudio.setANC(next);
    if (!audioEnabled) {
      await cabinAudio.ensureEnabled();
      setAudioEnabled(true);
    }
  }, [ancEnabled, audioEnabled]);

  const handleChangeWeather = useCallback(
    (nextId) => {
      const prevMode = WEATHER_MODES.find((w) => w.id === weatherId);
      const nextMode = WEATHER_MODES.find((w) => w.id === nextId);
      setWeatherId(nextId);
      if (nextMode?.seatbelt && !prevMode?.seatbelt) {
        cabinAudio.playSeatbeltChime();
      }
    },
    [weatherId]
  );

  const handleToggleWalkthrough = useCallback(() => {
    if (target.kind === 'walkthrough') {
      navigateTo(OVERVIEW_TARGET);
    } else {
      navigateTo({ kind: 'walkthrough' });
    }
  }, [target.kind, navigateTo]);

  const handleWalkProgress = useCallback((progress, x) => {
    const found = CABINS.find((c) => x >= c.start && x <= c.end) || CABINS[3];
    setWalkInfo({ progress, cabinName: found.name, x });
  }, []);

  const handleSavePostcard = useCallback(() => {
    if (!selectedSeat) return;
    const url = generateSouvenirPostcard({
      canvas: canvasElRef.current,
      seat: selectedSeat,
      env,
      weatherLabel: weather.label,
      altitudeFt: env.baseAltitude,
      tempC: env.baseTemp,
    });
    setPostcardData({ url, seatId: selectedSeat.id });
    setModal('postcard');
  }, [selectedSeat, env, weather.label]);

  const isInspectMode = phase === 'overview' || phase === 'class-view';
  const isSeatPov = phase === 'seat-pov' && target.kind === 'seat';
  const isWalkthrough = phase === 'walkthrough' && target.kind === 'walkthrough';

  const toolbarViewLabel =
    target.kind === 'class'
      ? activeCabin?.name
      : target.kind === 'seat'
      ? `${target.seat.id} · ${target.seat.viewLabel}`
      : target.kind === 'walkthrough'
      ? `복도 투어 · ${walkInfo.cabinName}`
      : '기체 전체 보기';

  const showSunBeacon =
    isInspectMode && (activeFilter === 'shade' || activeFilter === 'sun');

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="nav-wrap">
          <AerisBrand />
          <span className="nav-divider" />
          <nav aria-label="주 메뉴">
            <button
              type="button"
              className={`nav-link ${!modal || modal === 'list' || modal === 'help' ? 'current' : ''}`}
              onClick={() => setModal(null)}
            >
              좌석 탐색
            </button>
            <button
              type="button"
              className={`nav-link ${modal === 'flight' ? 'current' : ''}`}
              onClick={() => setModal('flight')}
            >
              항공편 정보
            </button>
          </nav>

          <div className="nav-end">
            <button
              type="button"
              className="booking-link"
              onClick={() => setModal('bookings')}
            >
              <Ticket size={17} /> 내 예약
              {booked.length > 0 && <b>{booked.length}</b>}
            </button>
            <span className="nav-divider" />
            <button
              type="button"
              className="help-button"
              title="이용 가이드"
              aria-label="이용 가이드"
              onClick={() => setModal('help')}
            >
              <CircleHelp size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="page">
        <div className="heading-row">
          <div>
            <div className="eyebrow">
              <i /> 3D 인터랙티브 좌석 선택
            </div>
            <h1>
              기내 익스플로러<span>.</span>
            </h1>
            <p>항공기 내부로 직접 들어가 양측 창문 시야, 시간대별 하늘, 기내 음향까지 체험하고 완벽한 좌석을 찾아보세요.</p>
          </div>

          <div className="route-summary">
            <div className="flight-no">
              <Plane size={14} /> EK215편
            </div>
            <RouteBadge />
          </div>
        </div>

        <div className="workspace-grid">
          <section className="explorer-column" aria-label="3D 항공기 탐색기">
            <div className={`viewer-shell ${expanded ? 'expanded' : ''}`}>
              <div className="viewer">
                <AircraftScene
                  target={target}
                  booked={booked}
                  zoom={zoom}
                  hoveredId={hovered?.seat.id || null}
                  selectedSeat={selectedSeat}
                  seatMode={seatMode}
                  privacyDoorClosed={privacyDoorClosed}
                  activeFilter={activeFilter}
                  env={env}
                  turbulenceLevel={weather.turbulence}
                  stormLevel={weather.storm}
                  seatbeltOn={weather.seatbelt}
                  dimLevel={dimLevel}
                  shutterPos={shutterPos}
                  frostEnabled={frostEnabled}
                  heightCm={heightCm}
                  showLegroomRuler={showLegroomRuler}
                  showSunBeacon={showSunBeacon}
                  interactive={isInspectMode && !modal}
                  lookResetTick={lookResetTick}
                  lookPreset={lookPreset}
                  walkPaused={walkPaused}
                  onWalkProgress={handleWalkProgress}
                  onCanvasReady={(el) => {
                    canvasElRef.current = el;
                  }}
                  onHover={handleHoverSeat}
                  onSelect={handleSelectSeat}
                  onSettled={handleSettled}
                />

                <div className="viewer-head">
                  {!isSeatPov && !isWalkthrough ? (
                    <div className="live-tag">
                      <i /> 실시간 뷰 · {env.phaseName}
                    </div>
                  ) : (
                    <span />
                  )}

                  {expanded && (
                    <div className="expanded-switcher" role="navigation" aria-label="빠른 클래스 전환">
                      <button
                        type="button"
                        className={target.kind === 'overview' ? 'active' : ''}
                        onClick={goOverview}
                        disabled={phase === 'transitioning'}
                      >
                        전체
                      </button>
                      {CABINS.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className={activeCabinId === c.id ? 'active' : ''}
                          onClick={() => navigateTo({ kind: 'class', cabin: c.id })}
                          disabled={phase === 'transitioning'}
                        >
                          {c.short}
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    className="expand"
                    onClick={() => setExpanded((v) => !v)}
                    title={expanded ? '확장 화면 닫기' : '화면 크게 보기'}
                    aria-label={expanded ? '확장 화면 닫기' : '화면 크게 보기'}
                  >
                    {expanded ? <X size={15} /> : <Maximize size={15} />}
                  </button>
                </div>

                {weather.seatbelt && !isWalkthrough && (
                  <div className="seatbelt-banner" role="status">
                    <AlertTriangle size={13} aria-hidden="true" />
                    <span>
                      좌석 벨트 착용등 점등 · {weather.label}
                    </span>
                  </div>
                )}

                {isInspectMode && (
                  <div className="aircraft-caption">
                    <div>
                      <span>{target.kind === 'class' ? '객실 상세 탐색' : '광동체 항공기'}</span>
                      <h2>{target.kind === 'class' ? activeCabin?.name : '보잉 777-300ER'}</h2>
                    </div>
                  </div>
                )}

                {isInspectMode && (
                  <div className="zoom">
                    <button
                      type="button"
                      aria-label="확대"
                      title="확대"
                      disabled={zoom >= 2}
                      onClick={() => setZoom((z) => Math.min(2, z + 0.25))}
                    >
                      <Plus size={17} />
                    </button>
                    <i />
                    <button
                      type="button"
                      aria-label="축소"
                      title="축소"
                      disabled={zoom <= 0.75}
                      onClick={() => setZoom((z) => Math.max(0.75, z - 0.25))}
                    >
                      <Minus size={17} />
                    </button>
                    <i />
                    <button
                      type="button"
                      aria-label="시점 초기화"
                      title="시점 초기화"
                      onClick={() => {
                        setZoom(1);
                        setLookResetTick((n) => n + 1);
                        if (target.kind !== 'overview') goOverview();
                      }}
                    >
                      <Crosshair size={16} />
                    </button>
                  </div>
                )}

                {isSeatPov && (
                  <WindowExperienceHUD
                    seat={target.seat}
                    env={env}
                    dimLevel={dimLevel}
                    onChangeDim={(lvl) => {
                      setDimLevel(lvl);
                      cabinAudio.playShutterClick();
                    }}
                    shutterPos={shutterPos}
                    onChangeShutter={(pos) => setShutterPos(pos)}
                    frostEnabled={frostEnabled}
                    onToggleFrost={() => setFrostEnabled((v) => !v)}
                    seatMode={seatMode}
                    onChangeSeatMode={setSeatMode}
                    privacyDoorClosed={privacyDoorClosed}
                    onTogglePrivacyDoor={() => {
                      setPrivacyDoorClosed((v) => !v);
                      cabinAudio.playShutterClick();
                    }}
                    heightCm={heightCm}
                    onChangeHeightCm={setHeightCm}
                    showLegroomRuler={showLegroomRuler}
                    onToggleLegroomRuler={setShowLegroomRuler}
                    activeLookDir={activeLookDir}
                    onSelectLookDir={handleSelectLookDir}
                    onBackToCabin={() => navigateTo({ kind: 'class', cabin: target.seat.cabin })}
                    onBackToOverview={goOverview}
                    onSavePostcard={handleSavePostcard}
                  />
                )}

                {isWalkthrough && (
                  <div className="walk-hud" role="region" aria-label="기내 복도 투어 제어">
                    <div className="walk-hud-top">
                      <span className="walk-badge">
                        <Footprints size={13} /> 기내 복도 걷기 중 · <b>{walkInfo.cabinName}</b>
                      </span>
                      <div className="walk-hud-btns">
                        <button
                          type="button"
                          className="hud-pill"
                          onClick={() => setWalkPaused((p) => !p)}
                        >
                          {walkPaused ? <Play size={12} /> : <Pause size={12} />}
                          {walkPaused ? '계속 걷기' : '일시정지'}
                        </button>
                        <button
                          type="button"
                          className="hud-pill subtle"
                          onClick={() => setLookResetTick((n) => n + 1)}
                        >
                          정면 시선
                        </button>
                        <button type="button" className="hud-pill dark" onClick={goOverview}>
                          투어 종료
                        </button>
                      </div>
                    </div>
                    <div className="walk-progress-track">
                      <div className="walk-progress-fill" style={{ width: `${Math.round(walkInfo.progress * 100)}%` }} />
                    </div>
                  </div>
                )}

                {phase === 'transitioning' && target.kind === 'class' && (
                  <ClassTitleOverlay cabinId={target.cabin} />
                )}
              </div>

              {isSeatPov && passVisible && (
                <BoardingPass
                  seat={target.seat}
                  booked={booked.includes(target.seat.id)}
                  effectiveDb={effectiveDb}
                  env={env}
                  onBook={bookCurrentSeat}
                  onCancelBooking={() => cancelBooking(target.seat.id)}
                  onBack={goOverview}
                  onNext={() => {
                    const idx = CABINS.findIndex((c) => c.id === target.seat.cabin);
                    navigateTo({ kind: 'class', cabin: CABINS[(idx + 1) % CABINS.length].id });
                  }}
                  onSavePostcard={handleSavePostcard}
                />
              )}

              <div className="view-toolbar">
                <span className="view-mode">
                  <Layers size={16} /> {toolbarViewLabel}
                </span>
                <i />
                {isSeatPov ? (
                  <button
                    type="button"
                    className="pass-visibility"
                    onClick={() => setPassVisible((v) => !v)}
                  >
                    <Ticket size={14} /> {passVisible ? '탑승권 숨기기' : '탑승권 보기'}
                  </button>
                ) : isWalkthrough ? (
                  <span className="hover-hint">드래그하여 복도 좌우·천장까지 360° 둘러보세요</span>
                ) : (
                  <span className="hover-hint">
                    <MousePointer2 size={14} /> 좌석을 클릭해 탑승하고 360° 양측 창문을 둘러보세요
                  </span>
                )}

                <button
                  type="button"
                  className="seat-list-toggle"
                  disabled={phase === 'transitioning'}
                  onClick={openSeatList}
                >
                  <List size={15} /> 좌석 배치도
                </button>

                <button
                  type="button"
                  aria-label={audioEnabled ? '기내 음향 끄기' : '기내 음향 켜기'}
                  aria-pressed={audioEnabled}
                  title={audioEnabled ? '기내 음향 끄기' : '기내 음향 켜기'}
                  onClick={handleToggleAudio}
                  className={`audio${audioEnabled ? ' audio-on' : ''}`}
                >
                  {audioEnabled ? <AudioLines size={16} /> : <VolumeX size={16} />}
                </button>
              </div>
            </div>

            <SmartSeatFinder
              activeFilter={activeFilter}
              onChangeFilter={setActiveFilter}
              env={env}
              booked={booked}
            />

            <FlightEnvironmentBar
              flightProgress={flightProgress}
              onChangeProgress={(p) => {
                setTimePlaying(false);
                setFlightProgress(p);
              }}
              timePlaying={timePlaying}
              onToggleTimePlaying={() => setTimePlaying((v) => !v)}
              env={env}
              weatherId={weatherId}
              onChangeWeather={handleChangeWeather}
              audioEnabled={audioEnabled}
              onToggleAudio={handleToggleAudio}
              ancEnabled={ancEnabled}
              onToggleAnc={handleToggleAnc}
              effectiveDb={effectiveDb}
              isWalkthrough={isWalkthrough}
              onToggleWalkthrough={handleToggleWalkthrough}
              disabledWalk={phase === 'transitioning'}
            />

            <TelemetryStrip env={env} turbulenceLevel={weather.turbulence} />
          </section>

          <aside className="directory">
            <div className="directory-head">
              <div className="section-icon">
                <Armchair size={19} />
              </div>
              <div>
                <div className="micro">객실 클래스 안내</div>
                <h2>클래스 둘러보기</h2>
              </div>
            </div>

            <div className="cabin-cards">
              {CABINS.map((c) => {
                const availCount = SEATS.filter(
                  (s) => s.cabin === c.id && !s.occupied && !booked.includes(s.id)
                ).length;
                return (
                  <button
                    key={c.id}
                    type="button"
                    className={`cabin-card ${c.id}${c.id === activeCabinId ? ' selected' : ''}`}
                    onClick={() => {
                      if (phase === 'class-view' && activeCabinId === c.id) {
                        openSeatList();
                      } else {
                        navigateTo({ kind: 'class', cabin: c.id });
                      }
                    }}
                    disabled={phase === 'transitioning'}
                    aria-label={`${c.name} 둘러보기`}
                  >
                    <div className="seat-pic">
                      <img src={CABIN_IMAGES[c.id]} alt="" />
                    </div>
                    <div className="cabin-text">
                      <span className="layout">
                        <i style={{ background: c.color }} /> {c.layout} 배열
                      </span>
                      <strong>{c.name}</strong>
                      <span className="from">
                        <b>{formatPrice(c.price)}</b>~ · 잔여 {availCount}석
                      </span>
                    </div>
                    <ChevronRight size={15} className="cabin-arrow" />
                  </button>
                );
              })}
            </div>

            <div className="status-key">
              <span>
                <i className="k-avail" /> 선택 가능
              </span>
              <span>
                <i className="k-occ" /> 예약됨
              </span>
              <span>
                <i className="k-booked" /> 내 예약
              </span>
            </div>
          </aside>
        </div>

        <footer>
          <span>
            <span className="online-dot" /> 시뮬레이션 온라인 · {env.phaseName} · {weather.label}
          </span>
          <span>
            AERIS <b>/</b> 3D 비행 체험
          </span>
        </footer>
      </main>

      {hovered && isInspectMode && !modal && (
        <div
          className="tooltip"
          role="tooltip"
          style={{
            left: Math.max(8, Math.min(hovered.x + 16, window.innerWidth - 235)),
            top: Math.max(8, Math.min(hovered.y + 16, window.innerHeight - 112)),
          }}
        >
          <div className="tt-top">
            <strong>{hovered.seat.id} 좌석</strong>
            <span className="tt-price">{formatPrice(CABIN_BY_ID[hovered.seat.cabin].price)}</span>
          </div>
          <span className="tt-status">
            {booked.includes(hovered.seat.id)
              ? '★ 내 예약 좌석 · 클릭해 다시 보기'
              : hovered.seat.occupied
              ? '● 이미 예약된 좌석'
              : '● 선택 가능 · 클릭해 착석하기'}
          </span>
          <small className="tt-meta">
            {hovered.seat.viewLabel} · 피치 {hovered.seat.pitchInches}&quot; · {hovered.seat.noiseDb} dB
          </small>
        </div>
      )}

      {modal && (
        <DialogPanel
          close={() => setModal(null)}
          wide={modal === 'list' || modal === 'postcard'}
          title={
            {
              flight: '항공편 상세 정보',
              bookings: '내 좌석 예약',
              help: '이용 가이드',
              list: '기내 좌석 배치도',
              postcard: '창밖 뷰 기념 엽서',
            }[modal]
          }
        >
          {modal === 'flight' && <FlightDetailsContent env={env} />}

          {modal === 'bookings' && (
            <BookingsModal
              booked={booked}
              onVisitSeat={(seat) => handleSelectSeat(seat)}
              onCancelSeat={cancelBooking}
              onClearAll={clearAllBookings}
              onClose={() => setModal(null)}
            />
          )}

          {modal === 'help' && <ExplorerGuideContent />}

          {modal === 'list' && (
            <SeatListModal
              cabinId={listCabin}
              onChangeCabin={setListCabin}
              booked={booked}
              activeFilter={activeFilter}
              env={env}
              onSelectSeat={handleSelectSeat}
            />
          )}

          {modal === 'postcard' && (
            <PostcardModal postcardUrl={postcardData.url} seatId={postcardData.seatId} />
          )}
        </DialogPanel>
      )}
    </div>
  );
}
