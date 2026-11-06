import { BUSINESS } from '../config.js';
import { money } from './format.js';

const W = 640;          // ancho lógico del lienzo
const PAD = 44;         // margen exterior oscuro
const TW = W - PAD * 2; // ancho del ticket
const SCALE = 2;        // nitidez (PNG de 1280 px de ancho)
const TOOTH = 16;
const FONT = 'Poppins, "Segoe UI", Arial, sans-serif';
const C = {
  bg: '#171827', paper: '#FFF9EF', ink: '#1E2035', mute: '#7A7C93',
  line: '#E3D9C6', a1: '#F7A84B', a2: '#EE5A6F',
};
const TYPE_LABEL = { domicilio: 'Domicilio', recoger: 'Recoger en el local', mesa: 'En mesa' };
export const PAY_LABEL = { efectivo: 'Efectivo', nequi: 'Nequi', daviplata: 'Daviplata', transferencia: 'Transferencia bancaria', tarjeta: 'Tarjeta (datáfono)' };

function wrap(ctx, text, maxW) {
  const out = []; let line = '';
  for (const w of String(text).split(/\s+/)) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t;
  }
  if (line) out.push(line);
  return out;
}

function paperPath(ctx, top, bottom) {
  ctx.beginPath(); ctx.moveTo(PAD, top);
  for (let i = 0; i < TW; i += TOOTH) { ctx.lineTo(PAD + i + TOOTH / 2, top - TOOTH / 2); ctx.lineTo(PAD + i + TOOTH, top); }
  ctx.lineTo(PAD + TW, bottom);
  for (let i = TW; i > 0; i -= TOOTH) { ctx.lineTo(PAD + i - TOOTH / 2, bottom + TOOTH / 2); ctx.lineTo(PAD + i - TOOTH, bottom); }
  ctx.closePath();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

function dashed(ctx, x1, x2, y) {
  ctx.save(); ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.setLineDash([8, 7]);
  ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke(); ctx.restore();
}

/** Pinta el ticket. Con H = null solo mide y devuelve la altura necesaria. */
function paint(ctx, order, H) {
  const draw = H != null;
  const top = PAD + TOOTH, headerH = 190;
  const L = PAD + 32, R = PAD + TW - 32;

  if (draw) {
    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    const glow = ctx.createRadialGradient(W * 0.85, 0, 10, W * 0.85, 0, W);
    glow.addColorStop(0, 'rgba(238,90,111,.35)'); glow.addColorStop(1, 'rgba(238,90,111,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);

    const bottom = H - PAD - TOOTH;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12;
    paperPath(ctx, top, bottom); ctx.fillStyle = C.paper; ctx.fill();
    ctx.restore();

    // Cabecera con degradado (recortada a la forma del papel)
    ctx.save(); paperPath(ctx, top, bottom); ctx.clip();
    const grad = ctx.createLinearGradient(PAD, 0, PAD + TW, 0);
    grad.addColorStop(0, C.a1); grad.addColorStop(1, C.a2);
    ctx.fillStyle = grad; ctx.fillRect(PAD, 0, TW, top + headerH);
    ctx.restore();

    ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
    ctx.font = `800 56px ${FONT}`; ctx.fillText(BUSINESS.name, W / 2, top + 76);
    ctx.font = `500 16px ${FONT}`; ctx.fillText(BUSINESS.tagline.toUpperCase().split('').join(' '), W / 2, top + 106);
    const pillW = 290;
    ctx.fillStyle = 'rgba(23,24,39,.88)'; roundRect(ctx, W / 2 - pillW / 2, top + 128, pillW, 40, 20); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = `700 18px ${FONT}`; ctx.fillText(`PEDIDO  ${order.order_code}`, W / 2, top + 155);
    ctx.textAlign = 'left';
  }

  let y = top + headerH + 44;

  // Datos del cliente
  const info = [
    ['Fecha', order.date_label],
    ['Recibe', order.customer_name],
    ['Teléfono', order.customer_phone],
    ['Entrega', TYPE_LABEL[order.order_type] || order.order_type],
    ['Pago', PAY_LABEL[order.payment_method] || order.payment_method],
    ...(order.cash_with ? [['Paga con', `${money(order.cash_with)}  (vuelto ${money(order.cash_with - order.total)})`]] : []),
    ...(order.latitude != null ? [['GPS', `${order.latitude.toFixed(5)}, ${order.longitude.toFixed(5)}`]] : []),
  ].filter(([, v]) => v);
  for (const [k, v] of info) {
    if (draw) {
      ctx.fillStyle = C.mute; ctx.font = `400 16px ${FONT}`; ctx.fillText(k, L, y);
      ctx.fillStyle = C.ink; ctx.font = `600 16px ${FONT}`; ctx.textAlign = 'right'; ctx.fillText(String(v), R, y); ctx.textAlign = 'left';
    }
    y += 30;
  }
  if (order.address) {
    ctx.font = `600 16px ${FONT}`;
    const addr = wrap(ctx, order.address, TW - 64 - 110);
    if (draw) {
      ctx.fillStyle = C.mute; ctx.font = `400 16px ${FONT}`; ctx.fillText('Dirección', L, y);
      ctx.fillStyle = C.ink; ctx.font = `600 16px ${FONT}`; ctx.textAlign = 'right';
      addr.forEach((l, i) => ctx.fillText(l, R, y + i * 22)); ctx.textAlign = 'left';
    }
    y += addr.length * 22 + 8;
  }
  y -= 8;
  if (draw) dashed(ctx, L, R, y);
  y += 34;

  // Productos
  if (draw) {
    ctx.fillStyle = C.mute; ctx.font = `600 13px ${FONT}`;
    ctx.fillText('CANT.   PRODUCTO', L, y); ctx.textAlign = 'right'; ctx.fillText('VALOR', R, y); ctx.textAlign = 'left';
  }
  y += 34;
  for (const it of order.items) {
    ctx.font = `500 19px ${FONT}`;
    const lines = wrap(ctx, it.name, TW - 64 - 56 - 130);
    if (draw) {
      ctx.fillStyle = C.a2; ctx.font = `700 19px ${FONT}`; ctx.fillText(`${it.qty}x`, L, y);
      ctx.fillStyle = C.ink; ctx.font = `500 19px ${FONT}`;
      lines.forEach((l, i) => ctx.fillText(l, L + 56, y + i * 26));
      ctx.font = `600 19px ${FONT}`; ctx.textAlign = 'right'; ctx.fillText(money(it.subtotal), R, y);
      if (it.qty > 1) { ctx.fillStyle = C.mute; ctx.font = `400 14px ${FONT}`; ctx.fillText(`${money(it.price)} c/u`, R, y + 22); }
      ctx.textAlign = 'left';
    }
    y += Math.max(lines.length * 26, it.qty > 1 ? 30 : 0) + 16;
  }
  y -= 4;
  if (draw) dashed(ctx, L, R, y);
  y += 50;

  // Total
  if (draw) {
    ctx.fillStyle = C.ink; ctx.font = `700 22px ${FONT}`; ctx.fillText('TOTAL', L, y);
    ctx.font = `800 36px ${FONT}`; ctx.textAlign = 'right';
    const tg = ctx.createLinearGradient(R - 220, 0, R, 0); tg.addColorStop(0, C.a1); tg.addColorStop(1, C.a2);
    ctx.fillStyle = tg; ctx.fillText(money(order.total), R, y + 4); ctx.textAlign = 'left';
  }
  y += 36;

  if (order.notes) {
    ctx.font = `400 16px ${FONT}`;
    const notes = wrap(ctx, `Notas: ${order.notes}`, TW - 64);
    if (draw) { ctx.fillStyle = C.mute; notes.forEach((l, i) => ctx.fillText(l, L, y + i * 24)); }
    y += notes.length * 24;
  }
  y += 20;

  // Código de barras decorativo derivado del código del pedido
  if (draw) {
    const seed = [...order.order_code].map((c) => c.charCodeAt(0));
    const bw = TW - 64 - 80; let bx = L + 40;
    ctx.fillStyle = C.ink;
    for (let i = 0; bx < L + 40 + bw; i++) {
      const w = 1 + ((seed[i % seed.length] + i * 7) % 4);
      if (i % 2 === 0) ctx.fillRect(bx, y, w, 54);
      bx += w + 1;
    }
    ctx.textAlign = 'center'; ctx.fillStyle = C.mute; ctx.font = `500 13px ${FONT}`;
    ctx.fillText(order.order_code.split('').join(' '), W / 2, y + 76);
    ctx.fillStyle = C.ink; ctx.font = `700 18px ${FONT}`;
    ctx.fillText('¡Gracias por tu pedido!', W / 2, y + 110);
    ctx.fillStyle = C.mute; ctx.font = `400 14px ${FONT}`;
    ctx.fillText(`WhatsApp ${BUSINESS.whatsappLabel}`, W / 2, y + 134);
    ctx.textAlign = 'left';
  }
  y += 150;
  return y + TOOTH + PAD;
}

/** Dibuja el ticket del pedido y devuelve un Blob PNG. */
export async function renderTicket(order) {
  try {
    await Promise.all([document.fonts?.load('800 20px Poppins'), document.fonts?.load('500 16px Poppins')]);
  } catch {}
  const measure = document.createElement('canvas').getContext('2d');
  const H = Math.ceil(paint(measure, order, null));

  const cv = document.createElement('canvas');
  cv.width = W * SCALE; cv.height = H * SCALE;
  const ctx = cv.getContext('2d');
  ctx.scale(SCALE, SCALE);
  paint(ctx, order, H);
  return new Promise((res) => cv.toBlob(res, 'image/png'));
}
