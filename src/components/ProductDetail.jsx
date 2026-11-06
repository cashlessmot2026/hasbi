import { useEffect, useRef, useState } from 'react';
import { money, imgUrl } from '../lib/format.js';
import { useGyro } from '../lib/motion.js';
import { IconBack, IconStar, IconShare, IconPlus, IconMinus, IconExpand } from './Icons.jsx';
import Lightbox from './Lightbox.jsx';

export default function ProductDetail({ product, fav, onFav, onAdd, onClose, pairings, onOpen }) {
  const [qty, setQty] = useState(1);
  const [img, setImg] = useState(0);
  const [zoom, setZoom] = useState(false);
  const heroRef = useRef(null);
  const scrollRef = useRef(null);
  useGyro(heroRef);

  useEffect(() => { setQty(1); setImg(0); scrollRef.current?.scrollTo(0, 0); }, [product.id]);

  useEffect(() => {
    const el = scrollRef.current;
    const on = () => heroRef.current?.style.setProperty('--s', Math.min(el.scrollTop / 300, 1).toFixed(3));
    el.addEventListener('scroll', on, { passive: true });
    return () => el.removeEventListener('scroll', on);
  }, []);

  const share = async () => {
    const data = { title: `Hasbi · ${product.name}`, text: `${product.name} — ${money(product.price)}`, url: location.href };
    try { if (navigator.share) await navigator.share(data); else await navigator.clipboard.writeText(`${data.text} ${data.url}`); } catch {}
  };

  const [whole, cents] = money(product.price).split(/(?=\.\d{3}$)/);

  return (
    <div className="detail" role="dialog" aria-label={product.name}>
      <div className="detail__scroll" ref={scrollRef}>
        <header className="detail__bar">
          <button className="icon-btn" onClick={onClose} aria-label="Volver"><IconBack /></button>
          <div className="detail__actions">
            <button className={`icon-btn ghost ${fav ? 'fav-on' : ''}`} onClick={() => onFav(product.id)} aria-label="Favorito"><IconStar /></button>
            <button className="icon-btn ghost" onClick={share} aria-label="Compartir"><IconShare /></button>
          </div>
        </header>

        <div className="detail__hero" ref={heroRef}>
          <div className="detail__plate" onClick={() => setZoom(true)}>
            <img src={imgUrl(product.images[img])} alt={product.name} draggable="false" />
            <span className="detail__expand"><IconExpand width={18} height={18} /></span>
          </div>
          {product.images.length > 1 && (
            <div className="thumbs">
              {product.images.map((src, n) => (
                <button key={src} className={n === img ? 'on' : ''} onClick={() => setImg(n)}>
                  <img src={imgUrl(src)} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <section className="detail__info">
          <div className="detail__head">
            <h2>{product.name}</h2>
            <div className="big-price"><small>$</small>{whole.replace('$', '')}<sup>{cents || ''}</sup></div>
          </div>
          {product.tags?.length > 0 && (
            <div className="tags">{product.tags.map((t) => <span key={t}>{t}</span>)}</div>
          )}
          <p className="detail__desc">{product.description}</p>

          {pairings.length > 0 && (
            <>
              <h4 className="section-title sm">Va perfecto con</h4>
              <div className="mini-row">
                {pairings.map((p) => (
                  <button key={p.id} className="mini" onClick={() => onOpen(p)}>
                    <img src={imgUrl(p.images[0])} alt="" loading="lazy" />
                    <span>{p.name}</span>
                    <b>{money(p.price)}</b>
                  </button>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      <footer className="detail__cta">
        <div className="stepper">
          <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Menos"><IconMinus width={16} /></button>
          <span>{String(qty).padStart(2, '0')}</span>
          <button onClick={() => setQty((q) => q + 1)} aria-label="Más"><IconPlus width={16} /></button>
        </div>
        <button className="btn-primary" onClick={(e) => { onAdd(product, e.currentTarget, qty); onClose(); }}>
          Agregar · {money(product.price * qty)}
        </button>
      </footer>

      {zoom && <Lightbox images={product.images} start={img} alt={product.name} onClose={() => setZoom(false)} />}
    </div>
  );
}
