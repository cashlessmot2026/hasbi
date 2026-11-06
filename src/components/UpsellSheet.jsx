import { money, imgUrl } from '../lib/format.js';
import { IconPlus } from './Icons.jsx';

/** Sugiere agregar algo más antes de cerrar el pedido. */
export default function UpsellSheet({ suggestions, cartQty, onAdd, onContinue, onClose, busy }) {
  return (
    <div className="sheet-backdrop" onClick={busy ? undefined : onClose}>
      <div className="sheet" role="dialog" aria-label="¿Deseas agregar algo más?" onClick={(e) => e.stopPropagation()}>
        <span className="sheet__grip" />
        <h2>¿Le sumamos algo más? 😋</h2>
        <p className="muted">Antes de terminar, estos acompañantes combinan perfecto con tu pedido.</p>
        <div className="upsell-grid">
          {suggestions.map((p) => {
            const q = cartQty(p.id);
            return (
              <button key={p.id} className={`upsell ${q ? 'added' : ''}`} onClick={(e) => onAdd(p, e.currentTarget)} disabled={busy}>
                <img src={imgUrl(p.images[0])} alt="" loading="lazy" />
                <span className="upsell__name">{p.name}</span>
                <span className="upsell__foot">
                  <b>{money(p.price)}</b>
                  <i>{q ? `×${q}` : <IconPlus width={14} height={14} />}</i>
                </span>
              </button>
            );
          })}
        </div>
        <button className="btn-primary lg block" onClick={onContinue} disabled={busy}>
          {busy ? <span className="spinner" /> : null}
          {busy ? 'Generando tu ticket…' : 'Finalizar y enviar por WhatsApp'}
        </button>
        {!busy && <button className="btn-link" onClick={onClose}>Seguir viendo el menú</button>}
      </div>
    </div>
  );
}
