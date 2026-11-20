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
    name: 'First Suite',
    short: 'First',
    price: 11800,
    layout: '1-2-1',
    aisleAfter: [0, 2],
    columns: ['A', 'D', 'G', 'K'],
    color: '#c69959',
    start: -21.6,
    end: -13.8,
    pitchInches: 79,
    widthInches: 23,
    reclineLabel: '180° Full Lie-Flat Suite',
    canLieFlat: true,
    hasPrivacyDoor: true,
    ifeSize: '32" 4K OLED',
    menu: {
      welcome: 'Dom Pérignon Vintage 2015 & Warm Arabic Dates',
      starter: 'Oscietra Caviar with Blinis, Crème Fraîche & Chives',
      main: 'Chargrilled Wagyu Tenderloin with Black Truffle Jus',
      dessert: 'Saffron Rose Mille-Feuille & Artisanal Espresso',
    },
  },
  {
    id: 'business',
    name: 'Business Class',
    short: 'Business',
    price: 5400,
    layout: '1-2-1',
    aisleAfter: [0, 2],
    columns: ['A', 'D', 'G', 'K'],
    color: '#7495a9',
    start: -13.8,
    end: -3.3,
    pitchInches: 62,
    widthInches: 20.5,
    reclineLabel: '180° Flat Bed',
    canLieFlat: true,
    hasPrivacyDoor: false,
    ifeSize: '23" HD Touchscreen',
    menu: {
      welcome: 'Veuve Clicquot Brut & Spiced Cardamom Welcome Drink',
      starter: 'Traditional Arabic Mezze with Warm Pita & Olive Oil',
      main: 'Pan-Seared Sea Bass with Saffron Risotto & Fennel',
      dessert: 'Valrhona Dark Chocolate Tart with Pistachio Gelato',
    },
  },
  {
    id: 'premium',
    name: 'Premium Economy',
    short: 'Premium',
    price: 2840,
    layout: '2-3-2',
    aisleAfter: [1, 4],
    columns: ['A', 'C', 'D', 'E', 'G', 'H', 'K'],
    color: '#8ca68e',
    start: -3.3,
    end: 4.5,
    pitchInches: 40,
    widthInches: 19.5,
    reclineLabel: '8" Deep Recline + Calf Rest',
    canLieFlat: false,
    hasPrivacyDoor: false,
    ifeSize: '13.3" 4K Display',
    menu: {
      welcome: 'Chandon Sparkling Wine & Roasted Almonds',
      starter: 'Smoked Salmon Tartare with Lemon Dill Cream',
      main: 'Herb-Crusted Chicken Supreme with Truffle Mash',
      dessert: 'Warm Sticky Date Pudding with Butterscotch Sauce',
    },
  },
  {
    id: 'economy',
    name: 'Economy Class',
    short: 'Economy',
    price: 1190,
    layout: '3-4-3',
    aisleAfter: [2, 6],
    columns: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K'],
    color: '#a896b6',
    start: 4.5,
    end: 21.6,
    pitchInches: 32,
    widthInches: 17.2,
    reclineLabel: '6" Ergonomic Recline',
    canLieFlat: false,
    hasPrivacyDoor: false,
    ifeSize: '13.3" HD Display',
    menu: {
      welcome: 'Refreshing Mint Citrus Towel & Still/Sparkling Water',
      starter: 'Mediterranean Quinoa & Roasted Pepper Salad',
      main: 'Braised Lamb Machboos with Fragrant Basmati Rice',
      dessert: 'Salted Caramel Cheesecake & Dilmah Ceylon Tea',
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

// Compute realistic ambient cabin dB based on proximity to GE90 engines (x ≈ -3.15, z ≈ ±8.05) and aft jetwash
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
      // Preserve iconic available demo seats (1A, 1K, 8A, 20A, 30A, 32A, 38A)
      const guaranteedFree = new Set(['1A', '1K', '8A', '20A', '30A', '30E', '32A', '38A']);
      const occupied =
        !guaranteedFree.has(id) && (row * 43 + colIdx * 17 + rowIdx * colIdx * 3) % 19 < 4;

      // Nearest fuselage window index (-21 + idx * 1.035)
      const windowIndex = Math.max(0, Math.min(41, Math.round((x - 0.11 + 21) / 1.035)));
      const windowX = -21 + windowIndex * 1.035;

      let viewLabel = 'Middle seat view';
      if (isWindow) {
        if (isOverWing) {
          viewLabel = `Window view · ${side === 'port' ? 'Left' : 'Right'} Wing`;
        } else if (x < -4.8) {
          viewLabel = 'Window view · Forward';
        } else {
          viewLabel = 'Window view · Aft';
        }
      } else if (isAisle) {
        viewLabel = 'Aisle view';
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

// 16h 15m Great Circle Polar Route: Dubai (DXB) -> Los Angeles (LAX)
export const FLIGHT_TOTAL_MINUTES = 16 * 60 + 15; // 975 min

export const ROUTE_WAYPOINTS = [
  { progress: 0.0, label: 'Dubai (DXB)', region: 'UAE · Persian Gulf', lat: 25.25, lon: 55.36, xPct: 12, yPct: 74 },
  { progress: 0.16, label: 'Caspian Sea', region: 'Iran / Azerbaijan Airspace', lat: 41.0, lon: 51.0, xPct: 26, yPct: 54 },
  { progress: 0.34, label: 'Barents Sea', region: 'Northern Scandinavia', lat: 69.5, lon: 34.0, xPct: 41, yPct: 24 },
  { progress: 0.54, label: 'Arctic Circle', region: 'North Polar Track · Aurora Zone', lat: 82.4, lon: -18.0, xPct: 56, yPct: 14 },
  { progress: 0.74, label: 'Hudson Bay', region: 'Northern Canada', lat: 60.2, lon: -88.0, xPct: 72, yPct: 33 },
  { progress: 0.90, label: 'Rocky Mountains', region: 'Western United States', lat: 41.5, lon: -109.5, xPct: 83, yPct: 55 },
  { progress: 1.0, label: 'Los Angeles (LAX)', region: 'California Coast', lat: 33.94, lon: -118.4, xPct: 90, yPct: 70 },
];

export const TIME_PRESETS = [
  { id: 'morning', label: 'Morning', progress: 0.08, timeLabel: '10:58 DXB' },
  { id: 'noon', label: 'Stratosphere', progress: 0.28, timeLabel: '14:13 UTC+4' },
  { id: 'aurora', label: 'Arctic Aurora', progress: 0.56, timeLabel: 'Polar Night' },
  { id: 'sunset', label: 'Golden Hour', progress: 0.86, timeLabel: 'LA Sunset' },
];

export const WEATHER_MODES = [
  { id: 'clear', label: 'Clear Sky', turbulence: 0.0, storm: 0.0, seatbelt: false },
  { id: 'chop', label: 'Light Chop', turbulence: 0.48, storm: 0.25, seatbelt: true },
  { id: 'storm', label: 'Storm Front', turbulence: 1.0, storm: 1.0, seatbelt: true },
];

export const SEAT_FILTERS = [
  { id: 'quiet', label: 'Quiet Zone', desc: 'Lowest engine noise (< 67.5 dB)' },
  { id: 'wing', label: 'Wing View', desc: 'Over-wing window with A6-AER view' },
  { id: 'shade', label: 'Shade Side', desc: 'Window away from direct sunlight' },
  { id: 'sun', label: 'Sun / Aurora', desc: 'Best window for sunset or aurora' },
  { id: 'legroom', label: 'Extra Legroom', desc: 'Suites, Business, Premium & Exit rows' },
  { id: 'exit', label: 'Fast Exit', desc: 'Forward cabin near boarding door' },
  { id: 'couple', label: 'Couple (2-Seat)', desc: 'Paired seats ideal for two travelers' },
];

/**
 * Compute continuous solar vector, atmospheric phase, sun-side (port/starboard), and aurora strength
 * from flightProgress in [0, 1].
 * Default progress = 0.86 reproduces the iconic original Aeris golden-hour sunset!
 */
export function getFlightEnvironment(progress) {
  const p = Math.max(0, Math.min(1, progress));

  // Elapsed & remaining flight time
  const elapsedMin = Math.round(p * FLIGHT_TOTAL_MINUTES);
  const remainMin = Math.max(0, FLIGHT_TOTAL_MINUTES - elapsedMin);
  const fmtHM = (mins) => `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, '0')}m`;

  // Interpolate waypoint
  let wpIdx = ROUTE_WAYPOINTS.findIndex((w) => w.progress >= p);
  if (wpIdx <= 0) wpIdx = 1;
  const w0 = ROUTE_WAYPOINTS[wpIdx - 1];
  const w1 = ROUTE_WAYPOINTS[wpIdx];
  const localT = (p - w0.progress) / Math.max(0.0001, w1.progress - w0.progress);
  const mapX = w0.xPct + (w1.xPct - w0.xPct) * localT;
  const mapY = w0.yPct + (w1.yPct - w0.yPct) * localT;
  const currentWaypoint = localT < 0.5 ? w0 : w1;

  // Solar elevation & azimuth across 16h polar crossing
  // p=0.08: morning (sun port/right-forward, y=0.36, z=+0.55)
  // p=0.28: high stratosphere noon (y=0.72, z=+0.22)
  // p=0.56: deep arctic night (y=-0.32, aurora peak!)
  // p=0.86: golden sunset matching original (-0.75, 0.19, -0.48)!
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

  // Night factor [0..1] and sunset/golden factor [0..1] and aurora factor [0..1]
  const nightFactor = Math.max(0, Math.min(1, (-sunDir[1] + 0.08) / 0.32));
  const goldenFactor = Math.max(
    0,
    Math.min(1, 1 - Math.abs(sunDir[1] - 0.16) / 0.26)
  ) * (1 - nightFactor * 0.75);
  const daylightFactor = Math.max(0, Math.min(1, (sunDir[1] - 0.15) / 0.45));

  // Aurora blooms in high Arctic latitudes (progress ~ 0.42..0.72) & night
  const arcticLat = Math.exp(-Math.pow((p - 0.56) / 0.14, 2));
  const auroraFactor = Math.max(0, Math.min(1, arcticLat * (0.25 + 0.95 * nightFactor)));

  // Determine sun side vs shade side (Port = A seats, z < 0; Starboard = K seats, z > 0)
  const sunSide = nightFactor > 0.55 ? 'aurora' : sunDir[2] < 0 ? 'port' : 'starboard';
  const shadeSide = sunSide === 'port' ? 'starboard' : sunSide === 'starboard' ? 'port' : 'both';

  let phaseName = 'Golden Hour';
  if (nightFactor > 0.55) {
    phaseName = auroraFactor > 0.45 ? 'Arctic Night · Aurora' : 'Polar Night';
  } else if (daylightFactor > 0.45) {
    phaseName = 'Stratosphere Noon';
  } else if (p < 0.2) {
    phaseName = 'Dubai Morning';
  }

  // Realistic cruising altitude/temp/speed profile
  const cruiseArc = Math.sin(Math.min(1, Math.max(0.06, p)) * Math.PI);
  const baseAltitude = Math.round(33000 + cruiseArc * 6000); // 33,000 -> 39,000 ft
  const baseSpeed = Math.round(542 + Math.sin(p * Math.PI * 1.4) * 28);
  const baseTemp = Math.round(-50 - cruiseArc * 8 - arcticLat * 5); // down to -63°C over pole!

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

/**
 * Check if a seat matches an active Smart Seat Finder filter.
 */
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

/**
 * Compute knee clearance in cm given passenger height (160..195cm) and seat pitch/recline.
 */
export function computeLegroomCm(seat, heightCm, isReclined) {
  const pitchCm = seat.pitchInches * 2.54;
  // Standard anthropometric buttock-to-knee length ≈ 0.34 * heightCm
  const femurCm = heightCm * 0.345;
  const seatBackThicknessCm = seat.cabin === 'economy' ? 11 : seat.cabin === 'premium' ? 14 : 18;
  const clearance = Math.round(pitchCm - seatBackThicknessCm - femurCm + (isReclined ? 3 : 0));
  let rating = 'Spacious';
  let tone = 'good';
  if (clearance < 6) {
    rating = 'Snug';
    tone = 'tight';
  } else if (clearance < 14) {
    rating = 'Comfortable';
    tone = 'ok';
  } else if (clearance >= 35) {
    rating = 'Suite Stretch';
    tone = 'luxury';
  }
  return { clearanceCm: Math.max(2, clearance), rating, tone, pitchCm: Math.round(pitchCm) };
}
