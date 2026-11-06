import { useMotion } from '../lib/motion.js';
import { money, imgUrl } from '../lib/format.js';
import { useI18n } from '../i18n/index.jsx';
import { IconPlus, IconStar } from './Icons.jsx';

export default function ProductCard({ product, onOpen, onAdd, fav, onFav, inCart, variant = 'grid' }) {
  const ref = useMotion();
  const { t, tp } = useI18n();
  const p = tp(product);
  return (
    <article ref={ref} className={`card card--${variant} motion`} onClick={() => onOpen(product)}>
      <div className="card__media">
        <img src={imgUrl(p.images?.[0])} alt={p.name} loading="lazy" draggable="false" />
        <span className="card__shine" />
        <button
          className={`card__fav ${fav ? 'on' : ''}`}
          aria-label={fav ? t('fav_remove') : t('fav_add')}
          onClick={(e) => { e.stopPropagation(); onFav(p.id); }}
        >
          <IconStar width={16} height={16} />
        </button>
        {p.tags?.[0] && <span className="card__tag">{t(`tag_${p.tags[0]}`)}</span>}
      </div>
      <div className="card__body">
        <h3 className="card__title">{p.name}</h3>
        <p className="card__desc">{p.description}</p>
        <div className="card__foot">
          <span className="price">{money(p.price)}</span>
          <button
            className={`btn-add ${inCart ? 'is-in' : ''}`}
            aria-label={`${t('add')} ${p.name}`}
            onClick={(e) => { e.stopPropagation(); onAdd(product, e.currentTarget); }}
          >
            {inCart ? <b>{inCart}</b> : <IconPlus width={18} height={18} />}
          </button>
        </div>
      </div>
    </article>
  );
}
