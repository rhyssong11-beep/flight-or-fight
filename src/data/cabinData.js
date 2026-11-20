import seatFirstImg from '../assets/seat-first.png';
import seatBusinessImg from '../assets/seat-business.png';
import seatPremiumImg from '../assets/seat-premium.png';
import seatEconomyImg from '../assets/seat-economy.png';

export const STORAGE_KEY = 'aeris.ek215.bookings.v2';
export const LEGACY_STORAGE_KEY = 'aeris.ek215.bookings.v1';

export const CABIN_IMAGES = {
  first: seatFirstImg,
  business: seatBusinessImg,
  premium: seatPremiumImg,
  economy: seatEconomyImg,
};

export const CABINS = [
  {
    id: 'first',
    name: '퍼스트 스위트',
    short: '퍼스트',
    price: 11800,
    layout: '1-2-1',
    aisleAfter: [0, 2],
    columns: ['A', 'D', 'G', 'K'],
    color: '#c69959',
    start: -21.6,
    end: -13.8,
    pitchInches: 79,
    widthInches: 23,
    reclineLabel: '180° 완전 풀플랫 프라이빗 스위트',
    canLieFlat: true,
    hasPrivacyDoor: true,
    ifeSize: '32인치 4K OLED',
    menu: {
      welcome: '돔 페리뇽 빈티지 2015 & 아라빅 대추야자',
      starter: '오세트라 캐비어와 블리니, 크렘 프레슈 & 차이브',
      main: '블랙 트러플 주스를 곁들인 숯불 와규 안심 스테이크',
      dessert: '사프란 로즈 밀푀유 & 아티잔 에스프레소',
    },
  },
  {
    id: 'business',
    name: '비즈니스 클래스',
    short: '비즈니스',
    price: 5400,
    layout: '1-2-1',
    aisleAfter: [0, 2],
    columns: ['A', 'D', 'G', 'K'],
    color: '#7495a9',
    start: -13.8,
    end: -3.3,
    pitchInches: 62,
    widthInches: 20.5,
    reclineLabel: '180° 플랫 베드',
    canLieFlat: true,
    hasPrivacyDoor: false,
    ifeSize: '23인치 HD 터치스크린',
    menu: {
      welcome: '뵈브 클리코 브뤼 샴페인 & 카다멈 웰컴 드링크',
      starter: '따뜻한 피타 브레드와 전통 아라빅 메제 플래터',
      main: '사프란 리조또를 곁들인 팬 시어드 농어 스테이크',
      dessert: '발로나 다크 초콜릿 타르트 & 피스타치오 젤라토',
    },
  },
  {
    id: 'premium',
    name: '프리미엄 이코노미',
    short: '프리미엄',
    price: 2840,
    layout: '2-3-2',
    aisleAfter: [1, 4],
    columns: ['A', 'C', 'D', 'E', 'G', 'H', 'K'],
    color: '#8ca68e',
    start: -3.3,
    end: 4.5,
    pitchInches: 40,
    widthInches: 19.5,
    reclineLabel: '8인치 딥 리클라이닝 + 종아리 받침',
    canLieFlat: false,
    hasPrivacyDoor: false,
    ifeSize: '13.3인치 4K 디스플레이',
    menu: {
      welcome: '샹동 스파클링 와인 & 로스티드 아몬드',
      starter: '레몬 딜 크림을 곁들인 훈제 연어 타르타르',
      main: '허브 치킨 슈프림 & 트러플 매시드 포테이토',
      dessert: '버터스카치 소스 스티키 데이트 푸딩',
    },
  },
  {
    id: 'economy',
    name: '이코노미 클래스',
    short: '이코노미',
    price: 1190,
    layout: '3-4-3',
    aisleAfter: [2, 6],
    columns: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K'],
    color: '#a896b6',
    start: 4.5,
    end: 21.6,
    pitchInches: 32,
    widthInches: 17.2,
    reclineLabel: '6인치 인체공학 리클라이닝',
    canLieFlat: false,
    hasPrivacyDoor: false,
    ifeSize: '13.3인치 HD 디스플레이',
    menu: {
      welcome: '민트 시트러스 물수건 & 스파클링/생수 서비스',
      starter: '지중해식 퀴노아 & 구운 파프리카 샐러드',
      main: '향긋한 바스마티 라이스를 곁들인 양고기 마흐부스',
      dessert: '솔티드 카라멜 치즈케이크 & 실론 홍차',
    },
  },
];

export const CABIN_BY_ID = Object.fromEntries(CABINS.map((c) => [c.id, c]));

const SEAT_SPEC = {
  first: {
    count: 3,
    firstRow: 1,
    firstX: -20.05,
    pitch: 2.52,
    columns: 'ADGK',
    zones: [-2.47, -0.65, 0.65, 2.47],
    windowCols: new Set(['A', 'K']),
    aisleCols: new Set(['A', 'D', 'G', 'K']),
    couplePairs: new Set(['D', 'G']),
  },
  business: {
    count: 5,
    firstRow: 8,
    firstX: -12.61,
    pitch: 2.03,
    columns: 'ADGK',
    zones: [-2.47, -0.63, 0.63, 2.47],
    windowCols: new Set(['A', 'K']),
    aisleCols: new Set(['A', 'D', 'G', 'K']),
    couplePairs: new Set(['D', 'G']),
  },
  premium: {
    count: 5,
    firstRow: 20,
    firstX: -2.35,
    pitch: 1.44,
    columns: 'ACDEGHK',
    zones: [-2.66, -1.97, -0.69, 0, 0.69, 1.97, 2.66],
    windowCols: new Set(['A', 'K']),
    aisleCols: new Set(['C', 'D', 'G', 'H']),
    couplePairs: new Set(['A', 'C', 'H', 'K']),
  },
  economy: {
    count: 16,
    firstRow: 30,
    firstX: 5.34,
    pitch: 1.015,
    columns: 'ABCDEFGHJK',
    zones: [-2.85, -2.33, -1.81, -0.78, -0.26, 0.26, 0.78, 1.81, 2.33, 2.85],
    windowCols: new Set(['A', 'K']),
    aisleCols: new Set(['C', 'D', 'G', 'H']),
    couplePairs: new Set([]),
  },
};

function computeSeatNoiseDb(x, z, cabinId) {
  const distToEngine = Math.hypot(x - -2.2, Math.abs(z) - 6.5);
  const engineBoost = Math.max(0, 1 - distToEngine / 16) * 8.5;
  const aftJetwash = x > 10 ? ((x - 10) / 12) * 6.5 : 0;
  const wallFactor = Math.abs(z) > 2.2 ? 1.4 : 0;
  const cabinInsulation =
    cabinId === 'first' ? -4.5 : cabinId === 'business' ? -2.0 : cabinId === 'premium' ? -0.5 : 0;
  return Math.round((66.5 + engineBoost + aftJetwash + wallFactor + cabinInsulation) * 10) / 10;
}

export const SEATS = CABINS.flatMap(({ id: cabinId }) => {
  const spec = SEAT_SPEC[cabinId];
  const cabinMeta = CABIN_BY_ID[cabinId];

  return Array.from({ length: spec.count }, (_, rowIdx) =>
    spec.zones.map((z, colIdx) => {
      const row = spec.firstRow + rowIdx;
      const col = spec.columns[colIdx];
      const id = `${row}${col}`;
      const stagger = cabinId === 'business' ? ((rowIdx + colIdx) % 2 ? -0.2 : 0.2) : 0;
      const x = spec.firstX + rowIdx * spec.pitch + stagger;
      const isWindow = spec.windowCols.has(col);
      const isAisle = !isWindow && spec.aisleCols.has(col);
      const positionType = isWindow ? 'window' : isAisle ? 'aisle' : 'middle';
      const positionLabel = isWindow ? '창가석' : isAisle ? '복도석' : '중앙석';
      const side = z < -0.05 ? 'port' : z > 0.05 ? 'starboard' : 'center';
      const isOverWing = x >= -4.8 && x <= 14.5;
      const isWingRegView = isWindow && side === 'port' && row >= 22 && row <= 36;
      const isBulkhead = rowIdx === 0;
      const isExitRow = row === 30 || row === 38;
      const hasExtraLegroom =
        cabinId === 'first' || cabinId === 'business' || cabinId === 'premium' || isBulkhead || isExitRow;
      const noiseDb = computeSeatNoiseDb(x, z, cabinId);
      const isQuiet = noiseDb <= 67.5;
      const isFastExit = x <= -8.0;
      const isCouple = spec.couplePairs.has(col);
      const pitchInches =
        cabinId === 'economy' && (isBulkhead || isExitRow)
          ? 38
          : cabinMeta.pitchInches;
      const guaranteedFree = new Set(['1A', '1K', '8A', '20A', '30A', '30E', '32A', '38A', '45A', '45K']);
      const occupied =
        !guaranteedFree.has(id) && (row * 43 + colIdx * 17 + rowIdx * colIdx * 3) % 19 < 4;

      const windowIndex = Math.max(0, Math.min(41, Math.round((x - 0.11 + 21) / 1.035)));
      const windowX = -21 + windowIndex * 1.035;

      let viewLabel = '중앙 좌석 뷰';
      if (isWindow) {
        if (isOverWing) {
          viewLabel = `창가 뷰 · ${side === 'port' ? '좌측' : '우측'} 날개`;
        } else if (x < -4.8) {
          viewLabel = '창가 뷰 · 전방 객실';
        } else {
          viewLabel = '창가 뷰 · 후방 객실';
        }
      } else if (isAisle) {
        viewLabel = '복도 좌석 뷰';
      }

      return {
        id,
        row,
        col,
        rowIdx,
        colIdx,
        cabin: cabinId,
        price: cabinMeta.price,
        x,
        z,
        windowX,
        windowIndex,
        side,
        positionType,
        positionLabel,
        isWindow,
        isAisle,
        isOverWing,
        isWingRegView,
        isBulkhead,
        isExitRow,
        hasExtraLegroom,
        noiseDb,
        isQuiet,
        isFastExit,
        isCouple,
        pitchInches,
        occupied,
        viewLabel,
      };
    })
  ).flat();
});

export const SEAT_BY_ID = Object.fromEntries(SEATS.map((s) => [s.id, s]));

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export const formatPrice = (v) => usdFormatter.format(v);

export const FLIGHT_TOTAL_MINUTES = 16 * 60 + 15; // 975 min

export const ROUTE_WAYPOINTS = [
  { progress: 0.0, label: '두바이 (DXB)', region: '아랍에미리트 · 페르시아만', lat: 25.25, lon: 55.36, xPct: 12, yPct: 74 },
  { progress: 0.16, label: '카스피해', region: '이란 · 아제르바이잔 상공', lat: 41.0, lon: 51.0, xPct: 26, yPct: 54 },
  { progress: 0.34, label: '바렌츠해', region: '북부 스칸디나비아 상공', lat: 69.5, lon: 34.0, xPct: 41, yPct: 24 },
  { progress: 0.54, label: '북극권 상공', region: '북극 항로 · 오로라 관측 구역', lat: 82.4, lon: -18.0, xPct: 56, yPct: 14 },
  { progress: 0.74, label: '허드슨만', region: '캐나다 북부 상공', lat: 60.2, lon: -88.0, xPct: 72, yPct: 33 },
  { progress: 0.90, label: '로키 산맥', region: '미국 서부 상공', lat: 41.5, lon: -109.5, xPct: 83, yPct: 55 },
  { progress: 1.0, label: '로스앤젤레스 (LAX)', region: '캘리포니아 해안', lat: 33.94, lon: -118.4, xPct: 90, yPct: 70 },
];

export const TIME_PRESETS = [
  { id: 'morning', label: '이륙 아침', progress: 0.08, timeLabel: '10:58 두바이' },
  { id: 'noon', label: '성층권 정오', progress: 0.28, timeLabel: '한낮 상공' },
  { id: 'aurora', label: '북극 오로라', progress: 0.56, timeLabel: '북극권 밤' },
  { id: 'sunset', label: '골든아워 노을', progress: 0.86, timeLabel: 'LA 노을' },
];

export const WEATHER_MODES = [
  { id: 'clear', label: '맑은 하늘', turbulence: 0.0, storm: 0.0, seatbelt: false },
  { id: 'chop', label: '약한 난기류', turbulence: 0.48, storm: 0.25, seatbelt: true },
  { id: 'storm', label: '폭풍 전선', turbulence: 1.0, storm: 1.0, seatbelt: true },
];

export const SEAT_FILTERS = [
  { id: 'quiet', label: '조용한 구역', desc: '엔진 소음이 가장 적은 좌석 (67.5 dB 이하)' },
  { id: 'wing', label: '날개 뷰 맛집', desc: '날개와 A6-AER 레터링이 잘 보이는 창가석' },
  { id: 'shade', label: '그늘 창가석', desc: '직사광선을 피할 수 있는 반대편 창가' },
  { id: 'sun', label: '노을·오로라 뷰', desc: '현재 시간대 노을이나 오로라가 정면으로 보이는 창가' },
  { id: 'legroom', label: '넓은 레그룸', desc: '스위트·비즈니스·프리미엄 및 비상구/벌크헤드 좌석' },
  { id: 'exit', label: '빠른 하기', desc: '탑승구와 가까운 전방 구역 좌석' },
  { id: 'couple', label: '2인 커플석', desc: '두 명이 나란히 앉기 좋은 페어 좌석' },
];

export function getFlightEnvironment(progress) {
  const p = Math.max(0, Math.min(1, progress));

  const elapsedMin = Math.round(p * FLIGHT_TOTAL_MINUTES);
  const remainMin = Math.max(0, FLIGHT_TOTAL_MINUTES - elapsedMin);
  const fmtHM = (mins) => `${Math.floor(mins / 60)}시간 ${String(mins % 60).padStart(2, '0')}분`;

  let wpIdx = ROUTE_WAYPOINTS.findIndex((w) => w.progress >= p);
  if (wpIdx <= 0) wpIdx = 1;
  const w0 = ROUTE_WAYPOINTS[wpIdx - 1];
  const w1 = ROUTE_WAYPOINTS[wpIdx];
  const localT = (p - w0.progress) / Math.max(0.0001, w1.progress - w0.progress);
  const mapX = w0.xPct + (w1.xPct - w0.xPct) * localT;
  const mapY = w0.yPct + (w1.yPct - w0.yPct) * localT;
  const currentWaypoint = localT < 0.5 ? w0 : w1;

  let sunX, sunY, sunZ;
  if (p < 0.28) {
    const t = p / 0.28;
    sunX = -0.35 + 0.15 * t;
    sunY = 0.28 + 0.44 * Math.sin(t * Math.PI * 0.5);
    sunZ = 0.68 - 0.46 * t;
  } else if (p < 0.56) {
    const t = (p - 0.28) / 0.28;
    sunX = -0.2 - 0.35 * t;
    sunY = 0.72 - 1.04 * t;
    sunZ = 0.22 - 0.52 * t;
  } else if (p < 0.86) {
    const t = (p - 0.56) / 0.30;
    sunX = -0.55 - 0.2 * t;
    sunY = -0.32 + 0.51 * t;
    sunZ = -0.30 - 0.18 * t;
  } else {
    const t = (p - 0.86) / 0.14;
    sunX = -0.75 - 0.1 * t;
    sunY = 0.19 - 0.14 * t;
    sunZ = -0.48 - 0.12 * t;
  }

  const mag = Math.hypot(sunX, sunY, sunZ) || 1;
  const sunDir = [sunX / mag, sunY / mag, sunZ / mag];

  const nightFactor = Math.max(0, Math.min(1, (-sunDir[1] + 0.08) / 0.32));
  const goldenFactor = Math.max(
    0,
    Math.min(1, 1 - Math.abs(sunDir[1] - 0.16) / 0.26)
  ) * (1 - nightFactor * 0.75);
  const daylightFactor = Math.max(0, Math.min(1, (sunDir[1] - 0.15) / 0.45));

  const arcticLat = Math.exp(-Math.pow((p - 0.56) / 0.14, 2));
  const auroraFactor = Math.max(0, Math.min(1, arcticLat * (0.25 + 0.95 * nightFactor)));

  const sunSide = nightFactor > 0.55 ? 'aurora' : sunDir[2] < 0 ? 'port' : 'starboard';
  const shadeSide = sunSide === 'port' ? 'starboard' : sunSide === 'starboard' ? 'port' : 'both';

  let phaseName = '골든아워 노을';
  if (nightFactor > 0.55) {
    phaseName = auroraFactor > 0.45 ? '북극권 밤 · 오로라' : '극지방 야간 비행';
  } else if (daylightFactor > 0.45) {
    phaseName = '성층권 정오';
  } else if (p < 0.2) {
    phaseName = '두바이 이륙 아침';
  }

  const cruiseArc = Math.sin(Math.min(1, Math.max(0.06, p)) * Math.PI);
  const baseAltitude = Math.round(33000 + cruiseArc * 6000);
  const baseSpeed = Math.round(542 + Math.sin(p * Math.PI * 1.4) * 28);
  const baseTemp = Math.round(-50 - cruiseArc * 8 - arcticLat * 5);

  return {
    progress: p,
    elapsedLabel: fmtHM(elapsedMin),
    remainingLabel: fmtHM(remainMin),
    sunDir,
    nightFactor,
    goldenFactor,
    daylightFactor,
    auroraFactor,
    sunSide,
    shadeSide,
    phaseName,
    mapX,
    mapY,
    currentWaypoint,
    baseAltitude,
    baseSpeed,
    baseTemp,
  };
}

export function matchesSeatFilter(seat, filterId, env, bookedSet) {
  if (!filterId) return false;
  if (seat.occupied || bookedSet.has(seat.id)) return false;

  switch (filterId) {
    case 'quiet':
      return seat.isQuiet;
    case 'wing':
      return seat.isWindow && seat.isOverWing;
    case 'shade':
      if (!seat.isWindow) return false;
      if (env.shadeSide === 'both') return true;
      return seat.side === env.shadeSide;
    case 'sun':
      if (!seat.isWindow) return false;
      if (env.sunSide === 'aurora') return true;
      return seat.side === env.sunSide;
    case 'legroom':
      return seat.hasExtraLegroom;
    case 'exit':
      return seat.isFastExit;
    case 'couple':
      return seat.isCouple;
    default:
      return false;
  }
}

export function computeLegroomCm(seat, heightCm, isReclined) {
  const pitchCm = seat.pitchInches * 2.54;
  const femurCm = heightCm * 0.345;
  const seatBackThicknessCm = seat.cabin === 'economy' ? 11 : seat.cabin === 'premium' ? 14 : 18;
  const clearance = Math.round(pitchCm - seatBackThicknessCm - femurCm + (isReclined ? 3 : 0));
  let rating = '여유로움';
  let tone = 'good';
  if (clearance < 6) {
    rating = '다소 타이트';
    tone = 'tight';
  } else if (clearance < 14) {
    rating = '적당함';
    tone = 'ok';
  } else if (clearance >= 35) {
    rating = '스위트급 광활함';
    tone = 'luxury';
  }
  return { clearanceCm: Math.max(2, clearance), rating, tone, pitchCm: Math.round(pitchCm) };
}
