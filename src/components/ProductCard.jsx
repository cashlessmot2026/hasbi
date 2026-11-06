import { useMotion } from '../lib/motion.js';
import { money, imgUrl } from '../lib/format.js';
import { IconPlus, IconStar } from './Icons.jsx';

export default function ProductCard({ product, onOpen, onAdd, fav, onFav, inCart, variant = 'grid' }) {
  const ref = useMotion();
  return (
    <article ref={ref} className={`card card--${variant} motion`} onClick={() => onOpen(product)}>
      <div className="card__media">
        <img src={imgUrl(product.images?.[0])} alt={product.name} loading="lazy" draggable="false" />
        <span className="card__shine" />
        <button
          className={`card__fav ${fav ? 'on' : ''}`}
          aria-label={fav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          onClick={(e) => { e.stopPropagation(); onFav(product.id); }}
        >
          <IconStar width={16} height={16} />
        </button>
        {product.tags?.[0] && <span className="card__tag">{product.tags[0]}</span>}
      </div>
      <div className="card__body">
        <h3 className="card__title">{product.name}</h3>
        <p className="card__desc">{product.description}</p>
        <div className="card__foot">
          <span className="price">{money(product.price)}</span>
          <button
            className={`btn-add ${inCart ? 'is-in' : ''}`}
            aria-label={`Agregar ${product.name}`}
            onClick={(e) => { e.stopPropagation(); onAdd(product, e.currentTarget); }}
          >
            {inCart ? <b>{inCart}</b> : <IconPlus width={18} height={18} />}
          </button>
        </div>
      </div>
    </article>
  );
}
