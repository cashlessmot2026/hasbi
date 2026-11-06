const cop = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });

export const money = (n) => `$${cop.format(n)}`;

export const imgUrl = (src) =>
  !src ? '' : /^https?:\/\//.test(src) ? src : `${import.meta.env.BASE_URL}images/${src.replace(/^\/?(images\/)?/, '')}`;

export function orderCode() {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `H${ymd}-${rnd}`;
}

export const dateLabel = (d = new Date()) =>
  d.toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
