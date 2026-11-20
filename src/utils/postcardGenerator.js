import { CABIN_BY_ID, formatPrice } from '../data/cabinData';

/**
 * Composites the live 3D WebGL viewport screenshot with a luxury Aeris
 * editorial boarding postcard frame (1600 x 1080) and returns a PNG data URL.
 */
export function generateSouvenirPostcard({ canvas, seat, env, weatherLabel, altitudeFt, tempC }) {
  const W = 1600;
  const H = 1080;
  const out = document.createElement('canvas');
  out.width = W;
  out.height = H;
  const ctx = out.getContext('2d');

  const cabin = CABIN_BY_ID[seat.cabin];

  // Warm cream card stock background
  ctx.fillStyle = '#fbf9f2';
  ctx.fillRect(0, 0, W, H);

  // Subtle gold inner border
  ctx.strokeStyle = '#d7cab0';
  ctx.lineWidth = 2;
  ctx.strokeRect(26, 26, W - 52, H - 52);

  // Photo viewport area
  const px = 56;
  const py = 56;
  const pw = W - 112;
  const ph = 706;
  const r = 18;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(px + r, py);
  ctx.lineTo(px + pw - r, py);
  ctx.quadraticCurveTo(px + pw, py, px + pw, py + r);
  ctx.lineTo(px + pw, py + ph - r);
  ctx.quadraticCurveTo(px + pw, py + ph, px + pw - r, py + ph);
  ctx.lineTo(px + r, py + ph);
  ctx.quadraticCurveTo(px, py + ph, px, py + ph - r);
  ctx.lineTo(px, py + r);
  ctx.quadraticCurveTo(px, py, px + r, py);
  ctx.closePath();
  ctx.clip();

  if (canvas && canvas.width > 0 && canvas.height > 0) {
    // Center-cover draw from live WebGL canvas
    const srcRatio = canvas.width / canvas.height;
    const dstRatio = pw / ph;
    let sx = 0, sy = 0, sw = canvas.width, sh = canvas.height;
    if (srcRatio > dstRatio) {
      sw = canvas.height * dstRatio;
      sx = (canvas.width - sw) / 2;
    } else {
      sh = canvas.width / dstRatio;
      sy = (canvas.height - sh) / 2;
    }
    ctx.drawImage(canvas, sx, sy, sw, sh, px, py, pw, ph);
  } else {
    const grad = ctx.createLinearGradient(px, py, px, py + ph);
    grad.addColorStop(0, '#5a6f82');
    grad.addColorStop(1, '#e8c49a');
    ctx.fillStyle = grad;
    ctx.fillRect(px, py, pw, ph);
  }

  // Soft bottom vignette for photo caption legibility
  const vig = ctx.createLinearGradient(0, py + ph - 160, 0, py + ph);
  vig.addColorStop(0, 'rgba(22, 18, 13, 0)');
  vig.addColorStop(1, 'rgba(22, 18, 13, 0.52)');
  ctx.fillStyle = vig;
  ctx.fillRect(px, py + ph - 160, pw, 160);

  // Photo overlay pill (top-left)
  ctx.fillStyle = 'rgba(255, 253, 245, 0.88)';
  ctx.beginPath();
  ctx.roundRect(px + 28, py + 26, 336, 40, 8);
  ctx.fill();
  ctx.fillStyle = '#33362f';
  ctx.font = '600 16px "DM Sans Variable", "DM Sans", -apple-system, sans-serif';
  ctx.fillText(`AERIS · EK215 · ${env.phaseName.toUpperCase()}`, px + 48, py + 52);

  // Photo bottom caption
  ctx.fillStyle = '#fffaf0';
  ctx.font = '500 18px "DM Sans Variable", "DM Sans", -apple-system, sans-serif';
  ctx.fillText(
    `${seat.viewLabel}  ·  ${altitudeFt.toLocaleString()} ft  ·  ${tempC}°C  ·  ${weatherLabel}`,
    px + 30,
    py + ph - 28
  );
  ctx.restore();

  // Bottom boarding pass editorial strip
  const by = py + ph + 36;

  // Brand + Route
  ctx.fillStyle = '#927446';
  ctx.font = '700 15px "DM Sans Variable", "DM Sans", -apple-system, sans-serif';
  ctx.fillText('AERIS  /  BOEING 777-300ER  (A6-AER)', 60, by + 20);

  ctx.fillStyle = '#24292b';
  ctx.font = '600 68px Georgia, "Times New Roman", serif';
  ctx.fillText('DXB', 58, by + 104);
  ctx.fillStyle = '#a78753';
  ctx.font = '400 40px "DM Sans Variable", sans-serif';
  ctx.fillText('→', 224, by + 95);
  ctx.fillStyle = '#24292b';
  ctx.font = '600 68px Georgia, "Times New Roman", serif';
  ctx.fillText('LAX', 284, by + 104);

  ctx.fillStyle = '#6f726a';
  ctx.font = '500 18px "DM Sans Variable", sans-serif';
  ctx.fillText(`Dubai 09:40  ·  Los Angeles 13:55  ·  Over ${env.currentWaypoint.label}`, 60, by + 148);

  // Vertical dashed divider
  ctx.save();
  ctx.setLineDash([7, 7]);
  ctx.strokeStyle = '#c9bca2';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(760, by + 4);
  ctx.lineTo(760, by + 195);
  ctx.stroke();
  ctx.restore();

  // Seat metadata columns
  const drawField = (label, value, x, y, large = false) => {
    ctx.fillStyle = '#857863';
    ctx.font = '700 13px "DM Sans Variable", sans-serif';
    ctx.fillText(label.toUpperCase(), x, y);
    ctx.fillStyle = '#262928';
    ctx.font = large
      ? '600 44px Georgia, "Times New Roman", serif'
      : '600 26px "DM Sans Variable", sans-serif';
    ctx.fillText(value, x, y + (large ? 48 : 34));
  };

  drawField('Seat', seat.id, 804, by + 26, true);
  drawField('Cabin', cabin.name, 970, by + 26);
  drawField('Fare', formatPrice(cabin.price), 970, by + 114);
  drawField('Gate / Boarding', 'B12 · 07:55', 804, by + 114);

  // Decorative aviation barcode on right
  const bx = 1320;
  const bTop = by + 14;
  ctx.fillStyle = '#2c2d29';
  let seed = seat.id.charCodeAt(0) * 97 + seat.row * 31;
  let curX = bx;
  for (let i = 0; i < 42 && curX < 1534; i++) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const w = 2 + (seed % 5);
    const gap = 2 + ((seed >> 4) % 4);
    ctx.fillRect(curX, bTop, w, 134);
    curX += w + gap;
  }
  ctx.fillStyle = '#756f61';
  ctx.font = '600 14px ui-monospace, monospace';
  ctx.fillText(`EK215-${seat.id}-A6AER`, bx + 18, bTop + 162);

  return out.toDataURL('image/png');
}

export function downloadDataUrl(dataUrl, filename) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
