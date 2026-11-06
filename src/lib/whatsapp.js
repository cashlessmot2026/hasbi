import { BUSINESS } from '../config.js';
import { money } from './format.js';

const TYPE_LABEL = { domicilio: '🛵 Domicilio', recoger: '🏃 Recoger en el local', mesa: '🍽️ En mesa' };

export function buildMessage(order) {
  const lines = [
    `🧾 *NUEVO PEDIDO · ${BUSINESS.name.toUpperCase()}*`,
    `Pedido: *${order.order_code}*`,
    '',
    `👤 ${order.customer_name}`,
  ];
  if (order.customer_phone) lines.push(`📞 ${order.customer_phone}`);
  lines.push(TYPE_LABEL[order.order_type] || order.order_type);
  if (order.address) lines.push(`📍 ${order.address}`);
  lines.push('', '*Detalle:*');
  order.items.forEach((it) => lines.push(`• ${it.qty} x ${it.name} — ${money(it.subtotal)}`));
  lines.push('', `💰 *TOTAL: ${money(order.total)}*`);
  if (order.notes) lines.push('', `📝 Notas: ${order.notes}`);
  if (order.ticket_url) lines.push('', `🎟️ Ticket: ${order.ticket_url}`);
  lines.push('', '¡Gracias! Quedo atento a la confirmación 🙌');
  return lines.join('\n');
}

// Se usa api.whatsapp.com directamente: la redirección de wa.me corrompe los emojis (los cambia por "�").
export const whatsappUrl = (text) =>
  `https://api.whatsapp.com/send?phone=${BUSINESS.whatsapp}&text=${encodeURIComponent(text)}`;
