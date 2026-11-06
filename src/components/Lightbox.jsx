import { useEffect, useRef, useState } from 'react';
import { imgUrl } from '../lib/format.js';
import { IconClose } from './Icons.jsx';

/** Visor de imagen a pantalla completa: toque para hacer zoom, desliza para cambiar de foto. */
export default function Lightbox({ images, start = 0, alt, onClose }) {
  const [i, setI] = useState(start);
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState('50% 50%');
  const touch = useRef(null);

  useEffect(() => {
    const k = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setI((v) => (v + 1) % images.length);
      if (e.key === 'ArrowLeft') setI((v) => (v - 1 + images.length) % images.length);
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [images.length, onClose]);

  const toggleZoom = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
    setZoom((z) => !z);
  };
  const onMove = (e) => {
    if (!zoom || e.pointerType === 'touch') return;
    const r = e.currentTarget.getBoundingClientRect();
    setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
  };

  return (
    <div className="lightbox" role="dialog" aria-label={alt} onClick={onClose}>
      <button className="icon-btn lightbox__close" onClick={onClose} aria-label="Cerrar"><IconClose /></button>
      <div
        className="lightbox__stage"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (zoom || touch.current == null || images.length < 2) return;
          const dx = e.changedTouches[0].clientX - touch.current;
          if (Math.abs(dx) > 50) setI((v) => (v + (dx < 0 ? 1 : -1) + images.length) % images.length);
          touch.current = null;
        }}
      >
        <img
          key={i}
          src={imgUrl(images[i])}
          alt={alt}
          className={zoom ? 'zoomed' : ''}
          style={{ transformOrigin: origin }}
          onClick={toggleZoom}
          onPointerMove={onMove}
          draggable="false"
        />
      </div>
      {images.length > 1 && (
        <div className="dots" onClick={(e) => e.stopPropagation()}>
          {images.map((_, n) => (
            <button key={n} className={n === i ? 'on' : ''} onClick={() => setI(n)} aria-label={`Foto ${n + 1}`} />
          ))}
        </div>
      )}
      <p className="lightbox__hint">Toca la imagen para hacer zoom</p>
    </div>
  );
}
