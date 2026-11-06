import { useMemo } from 'react';
import { IconWhatsApp, IconDownload, IconShare, IconClose } from './Icons.jsx';
import { useI18n } from '../i18n/index.jsx';

export default function TicketModal({ result, onClose }) {
  const { blob, waUrl, order } = result;
  const { t } = useI18n();
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
        <button className="icon-btn ghost ticket-modal__close" onClick={onClose} aria-label={t('close')}><IconClose /></button>
        <h2>{t('tk_title')}</h2>
        <p className="muted">
          {t('tk_text')}{!order.ticket_url && ` ${t('tk_attach')}`}
        </p>
        <div className="ticket-modal__img">
          <img src={url} alt={`Ticket del pedido ${order.order_code}`} />
        </div>
        <a className="btn-wa" href={waUrl} target="_blank" rel="noopener noreferrer">
          <IconWhatsApp /> {t('tk_openWa')}
        </a>
        <div className="ticket-modal__row">
          {canShareFile && (
            <button className="btn-soft" onClick={shareImage}><IconShare width={18} /> {t('tk_sendImg')}</button>
          )}
          <button className="btn-soft" onClick={download}><IconDownload width={18} /> {t('tk_download')}</button>
        </div>
      </div>
    </div>
  );
}
