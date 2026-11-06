import { money, imgUrl } from '../lib/format.js';
import { useI18n } from '../i18n/index.jsx';
import { IconPlus, IconMinus, IconTrash, IconCart } from './Icons.jsx';

/** Paso 1: revisar los productos del pedido. */
export default function CartView({ lines, total, count, setQty, remove, onContinue, onBrowse }) {
  const { t, tp } = useI18n();

  if (!lines.length) {
    return (
      <div className="empty">
        <div className="empty__icon"><IconCart width={40} height={40} /></div>
        <h2>{t('emptyTitle')}</h2>
        <p>{t('emptyText')}</p>
        <button className="btn-primary" onClick={onBrowse}>{t('seeMenu')}</button>
      </div>
    );
  }

  return (
    <div className="cart">
      <h1 className="page-title">{t('yourOrder')}</h1>
      <ul className="cart__list">
        {lines.map(({ product, qty }) => {
          const p = tp(product);
          return (
            <li key={p.id} className="cart-line">
              <img src={imgUrl(p.images[0])} alt="" />
              <div className="cart-line__info">
                <h3>{p.name}</h3>
                <span className="muted">{money(p.price)} {t('each')}</span>
                <b className="price">{money(p.price * qty)}</b>
              </div>
              <div className="cart-line__ctrl">
                <button type="button" className="icon-btn sm ghost" onClick={() => remove(p.id)} aria-label={t('remove')}><IconTrash width={16} /></button>
                <div className="stepper sm">
                  <button type="button" onClick={() => setQty(p.id, qty - 1)} aria-label="-"><IconMinus width={14} /></button>
                  <span>{qty}</span>
                  <button type="button" onClick={() => setQty(p.id, qty + 1)} aria-label="+"><IconPlus width={14} /></button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="cart__total">
        <div>
          <span className="muted">{t('total')} · {t('items', { n: count })}</span>
          <strong>{money(total)}</strong>
        </div>
        <button type="button" className="btn-primary lg" onClick={onContinue}>{t('continue')}</button>
      </div>
    </div>
  );
}
