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
        <small>두바이</small>
      </div>
      <span className="airline">
        <i />
        <Plane size={17} fill="currentColor" />
        <i />
      </span>
      <div>
        <strong>LAX</strong>
        <small>로스앤젤레스</small>
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
    { icon: <Mountain />, title: '비행 고도', value: alt, unit: 'ft' },
    { icon: <Gauge />, title: '대지 속도', value: String(spd), unit: 'mph' },
    { icon: <Thermometer />, title: '외기 온도', value: `−${Math.abs(tmp)}`, unit: '°C' },
    { icon: <Clock3 />, title: '남은 비행 시간', value: env.remainingLabel, unit: '' },
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
          <button type="button" className="square" onClick={close} aria-label="대화상자 닫기">
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
    ['운항 기종', '보잉 777-300ER · 등록번호 A6-AER'],
    ['출발', '두바이 (DXB) · 09:40 GST'],
    ['도착', '로스앤젤레스 (LAX) · 13:55 PST'],
    ['비행 시간', '16시간 15분 · 직항 북극 항로'],
    ['현재 비행 구간', `${env.currentWaypoint.label} (${env.currentWaypoint.region})`],
    ['게이트 / 탑승 시각', '제3터미널 · B12 게이트 · 07:55'],
  ];
  return (
    <>
      <div className="flight-label">
        <Plane size={16} /> EK215편 · 보잉 777-300ER
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
      '3D 좌석 호버 & 스마트 좌석 찾기',
      '3D 좌석 위에 마우스를 올리면 운임, 소음(dB), 예약 가능 여부를 즉시 확인할 수 있습니다. 스마트 필터 칩을 누르면 조용한 좌석, 날개 뷰, 그늘 창가석이 황금빛으로 강조됩니다.',
    ],
    [
      <ScanLine key="s" />,
      '360° 양측 창문 시야 · 셔터 · 리클라이닝',
      '좌석을 클릭해 탑승한 뒤 화면을 드래그하거나 상단 시점 버튼을 누르면 좌측 창문(A)부터 기내 통로, 반대쪽 우측 창문(K)과 별빛 천장까지 360° 자유롭게 둘러볼 수 있습니다.',
    ],
    [
      <Sparkles key="a" />,
      '16시간 북극 오로라 & 난기류 체험',
      '비행 타임라인을 움직여 이륙 아침·정오·북극 오로라 밤(별빛 천장 자동 점등)·골든아워 노을을 감상하고, 폭풍 전선에서 날개 탄성(Wing Flex)과 번개, 안전벨트 차임을 체험해 보세요.',
    ],
    [
      <Headphones key="h" />,
      '좌석별 공간 음향 & 노이즈 캔슬링(ANC)',
      '기내 음향을 켜면 엔진과의 거리에 따라 좌석별 소리가 달라지며, 노이즈 캔슬링 ON을 눌러 엔진 저주파 소음이 차단되는 차이를 직접 들을 수 있습니다.',
    ],
    [
      <Footprints key="w" />,
      '1인칭 복도 걷기 & 실제 배열 좌석표',
      '기내 복도 걷기로 퍼스트 스위트부터 이코노미 끝까지 걸어가며 공간감을 비교하거나, 좌석 배치도에서 1-2-1 / 2-3-2 / 3-4-3 실제 배열을 키보드로 탐색할 수 있습니다.',
    ],
    [
      <Keyboard key="k" />,
      '단축키 안내',
      'Escape(Esc) 키를 누르면 모달, 확장 화면, 또는 좌석 시점에서 기체 전체 보기로 빠르게 돌아옵니다.',
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
