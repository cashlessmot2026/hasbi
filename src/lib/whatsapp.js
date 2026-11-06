import { BUSINESS } from '../config.js';
import { money } from './format.js';
import { PAY_LABEL } from './ticket.js';

const TYPE_LABEL = { domicilio: '🛵 Domicilio', recoger: '🏃 Recoger en el local', mesa: '🍽️ En mesa' };

export function buildMessage(order) {
  const lines = [
    `🧾 *NUEVO PEDIDO · ${BUSINESS.name.toUpperCase()}*`,
    `Pedido: *${order.order_code}*`,
    '',
    `👤 Recibe: ${order.customer_name}`,
    `📞 Teléfono: ${order.customer_phone}`,
    TYPE_LABEL[order.order_type] || order.order_type,
  ];
  if (order.address) lines.push(`${order.order_type === 'mesa' ? '🪑 Mesa' : '🏠 Dirección'}: ${order.address}`);
  if (order.maps_url) lines.push(`📍 Ubicación GPS: ${order.maps_url}`);
  else if (order.order_type === 'domicilio') lines.push('📍 Ubicación GPS: no compartida. Por favor envíame mi ubicación (pin) por este chat.');
  lines.push(`💳 Pago: ${PAY_LABEL[order.payment_method] || order.payment_method}`);
  if (order.cash_with) lines.push(`💵 Paga con ${money(order.cash_with)} · vuelto ${money(order.cash_with - order.total)}`);
  lines.push('', '*Detalle:*');
  order.items.forEach((it) => lines.push(`• ${it.qty} x ${it.name} — ${money(it.subtotal)}`));
  lines.push('', `💰 *TOTAL: ${money(order.total)}*`);
  if (order.notes) lines.push('', `📝 Notas: ${order.notes}`);
  if (order.ticket_url) lines.push('', `🎟️ Ticket: ${order.ticket_url}`);
  if (order.language && order.language !== 'es') lines.push(`🌐 Idioma del cliente: ${order.language_label || order.language}`);
  lines.push('', '¡Gracias! Quedo atento a la confirmación 🙌');
  return lines.join('\n');
}

// Se usa api.whatsapp.com directamente: la redirección de wa.me corrompe los emojis (los cambia por "�").
export const whatsappUrl = (text) =>
  `https://api.whatsapp.com/send?phone=${BUSINESS.whatsapp}&text=${encodeURIComponent(text)}`;
