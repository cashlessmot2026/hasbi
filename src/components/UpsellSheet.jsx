import { money, imgUrl } from '../lib/format.js';
import { useI18n } from '../i18n/index.jsx';
import { IconPlus } from './Icons.jsx';

/** Paso 2: sugiere agregar algo más. El cliente puede rechazar con "No, gracias". */
export default function UpsellSheet({ suggestions, cartQty, added, onAdd, onContinue, onClose }) {
  const { t, tp } = useI18n();
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-label={t('up_title')} onClick={(e) => e.stopPropagation()}>
        <span className="sheet__grip" />
        <h2>{t('up_title')}</h2>
        <p className="muted">{t('up_text')}</p>
        <div className="upsell-grid">
          {suggestions.map((raw) => {
            const p = tp(raw);
            const q = cartQty(p.id);
            return (
              <button key={p.id} className={`upsell ${q ? 'added' : ''}`} onClick={(e) => onAdd(raw, e.currentTarget)}>
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
        {added > 0 ? (
          <button className="btn-primary lg block" onClick={onContinue}>{t('up_continue', { n: added })}</button>
        ) : (
          <button className="btn-outline lg block" onClick={onContinue}>{t('up_noThanks')}</button>
        )}
        <button className="btn-link" onClick={onClose}>{t('up_keep')}</button>
      </div>
    </div>
  );
}
