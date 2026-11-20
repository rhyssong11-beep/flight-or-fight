import { CABIN_BY_ID, formatPrice } from '../data/cabinData';

export function generateSouvenirPostcard({ canvas, seat, env, weatherLabel, altitudeFt, tempC }) {
  const W = 1600;
  const H = 1080;
  const out = document.createElement('canvas');
  out.width = W;
  out.height = H;
  const ctx = out.getContext('2d');

  const cabin = CABIN_BY_ID[seat.cabin];
  const sans = '"DM Sans Variable", "Apple SD Gothic Neo", "Pretendard", "Noto Sans KR", sans-serif';

  ctx.fillStyle = '#fbf9f2';
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = '#d7cab0';
  ctx.lineWidth = 2;
  ctx.strokeRect(26, 26, W - 52, H - 52);

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

  const vig = ctx.createLinearGradient(0, py + ph - 160, 0, py + ph);
  vig.addColorStop(0, 'rgba(22, 18, 13, 0)');
  vig.addColorStop(1, 'rgba(22, 18, 13, 0.55)');
  ctx.fillStyle = vig;
  ctx.fillRect(px, py + ph - 160, pw, 160);

  const pillText = `AERIS · EK215 · ${env.phaseName}`;
  ctx.font = `600 16px ${sans}`;
  const pillW = Math.max(280, ctx.measureText(pillText).width + 44);
  ctx.fillStyle = 'rgba(255, 253, 245, 0.9)';
  ctx.beginPath();
  ctx.roundRect(px + 28, py + 26, pillW, 40, 8);
  ctx.fill();
  ctx.fillStyle = '#33362f';
  ctx.fillText(pillText, px + 48, py + 52);

  ctx.fillStyle = '#fffaf0';
  ctx.font = `500 18px ${sans}`;
  ctx.fillText(
    `${seat.viewLabel}  ·  고도 ${altitudeFt.toLocaleString()} ft  ·  외기온도 ${tempC}°C  ·  ${weatherLabel}`,
    px + 30,
    py + ph - 28
  );
  ctx.restore();

  const by = py + ph + 36;

  ctx.fillStyle = '#927446';
  ctx.font = `700 15px ${sans}`;
  ctx.fillText('AERIS  /  보잉 777-300ER  (A6-AER)', 60, by + 20);

  ctx.fillStyle = '#24292b';
  ctx.font = '600 68px Georgia, "Times New Roman", serif';
  ctx.fillText('DXB', 58, by + 104);
  ctx.fillStyle = '#a78753';
  ctx.font = `400 40px ${sans}`;
  ctx.fillText('→', 224, by + 95);
  ctx.fillStyle = '#24292b';
  ctx.font = '600 68px Georgia, "Times New Roman", serif';
  ctx.fillText('LAX', 284, by + 104);

  ctx.fillStyle = '#6f726a';
  ctx.font = `500 18px ${sans}`;
  ctx.fillText(`두바이 09:40 출발  ·  로스앤젤레스 13:55 도착  ·  ${env.currentWaypoint.label} 통과`, 60, by + 148);

  ctx.save();
  ctx.setLineDash([7, 7]);
  ctx.strokeStyle = '#c9bca2';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(760, by + 4);
  ctx.lineTo(760, by + 195);
  ctx.stroke();
  ctx.restore();

  const drawField = (label, value, x, y, large = false) => {
    ctx.fillStyle = '#857863';
    ctx.font = `700 13px ${sans}`;
    ctx.fillText(label, x, y);
    ctx.fillStyle = '#262928';
    ctx.font = large
      ? '600 44px Georgia, "Times New Roman", serif'
      : `600 24px ${sans}`;
    ctx.fillText(value, x, y + (large ? 48 : 34));
  };

  drawField('좌석 번호', seat.id, 804, by + 26, true);
  drawField('객실 클래스', cabin.name, 970, by + 26);
  drawField('예상 운임', formatPrice(cabin.price), 970, by + 114);
  drawField('게이트 / 탑승', 'B12 · 07:55', 804, by + 114);

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
