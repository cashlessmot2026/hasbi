import { useMemo } from 'react';
import { IconWhatsApp, IconDownload, IconShare, IconClose } from './Icons.jsx';

export default function TicketModal({ result, onClose }) {
  const { blob, waUrl, order } = result;
  const url = useMemo(() => URL.createObjectURL(blob), [blob]);
  const file = useMemo(() => new File([blob], `ticket-${order.order_code}.png`, { type: 'image/png' }), [blob, order.order_code]);
  const canShareFile = typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file] });

  const download = () => {
    const a = document.createElement('a');
    a.href = url; a.download = file.name; document.body.appendChild(a); a.click(); a.remove();
  };
  const shareImage = async () => {
    try { await navigator.share({ files: [file], title: `Pedido ${order.order_code}`, text: `Ticket de mi pedido ${order.order_code}` }); } catch {}
  };

  return (
    <div className="sheet-backdrop center" onClick={onClose}>
      <div className="ticket-modal" role="dialog" aria-label="Ticket del pedido" onClick={(e) => e.stopPropagation()}>
        <button className="icon-btn ghost ticket-modal__close" onClick={onClose} aria-label="Cerrar"><IconClose /></button>
        <h2>¡Pedido listo! 🎉</h2>
        <p className="muted">
          Se abrió WhatsApp con tu pedido precargado. Solo presiona <b>Enviar</b>.
          {!order.ticket_url && ' Adjunta también la imagen del ticket.'}
        </p>
        <div className="ticket-modal__img">
          <img src={url} alt={`Ticket del pedido ${order.order_code}`} />
        </div>
        <a className="btn-wa" href={waUrl} target="_blank" rel="noopener noreferrer">
          <IconWhatsApp /> Abrir chat de WhatsApp
        </a>
        <div className="ticket-modal__row">
          {canShareFile && (
            <button className="btn-soft" onClick={shareImage}><IconShare width={18} /> Enviar imagen</button>
          )}
          <button className="btn-soft" onClick={download}><IconDownload width={18} /> Descargar</button>
        </div>
      </div>
    </div>
  );
}
