import { useEffect, useRef } from 'react';

const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const finePointer = () => window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;

// ---- Bucle único de scroll: cada elemento registrado recibe --p (-1 arriba … 0 centro … 1 abajo)
const items = new Set();
let ticking = false;
function frame() {
  ticking = false;
  const vh = window.innerHeight;
  for (const el of items) {
    const r = el.getBoundingClientRect();
    if (r.bottom < -100 || r.top > vh + 100) continue;
    const p = Math.max(-1, Math.min(1, (r.top + r.height / 2 - vh / 2) / (vh / 2)));
    el.style.setProperty('--p', p.toFixed(3));
  }
}
const schedule = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
let bound = false;
function bind() {
  if (bound) return; bound = true;
  window.addEventListener('scroll', schedule, { passive: true, capture: true });
  window.addEventListener('resize', schedule, { passive: true });
}

/** Parallax + aparición al hacer scroll + inclinación 3D con el cursor. */
export function useMotion({ tilt = true, max = 9 } = {}) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || reduced()) { el?.classList.add('in'); return; }

    bind(); items.add(el); schedule();

    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add('in'); io.disconnect(); } },
      { threshold: 0.12 }
    );
    io.observe(el);

    let onMove, onLeave;
    if (tilt && finePointer()) {
      onMove = (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty('--ry', `${(x * max * 2).toFixed(2)}deg`);
        el.style.setProperty('--rx', `${(-y * max * 2).toFixed(2)}deg`);
        el.style.setProperty('--mx', `${((x + 0.5) * 100).toFixed(1)}%`);
        el.style.setProperty('--my', `${((y + 0.5) * 100).toFixed(1)}%`);
        el.classList.add('hovering');
      };
      onLeave = () => {
        el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg');
        el.classList.remove('hovering');
      };
      el.addEventListener('pointermove', onMove);
      el.addEventListener('pointerleave', onLeave);
    }
    return () => {
      items.delete(el); io.disconnect();
      if (onMove) { el.removeEventListener('pointermove', onMove); el.removeEventListener('pointerleave', onLeave); }
    };
  }, [tilt, max]);
  return ref;
}

/** Inclinación por giroscopio (Android; en iOS requiere permiso, se omite). */
export function useGyro(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el || reduced() || finePointer() || typeof DeviceOrientationEvent === 'undefined') return;
    if (typeof DeviceOrientationEvent.requestPermission === 'function') return;
    const on = (e) => {
      const g = Math.max(-20, Math.min(20, e.gamma || 0));
      const b = Math.max(-20, Math.min(20, (e.beta || 45) - 45));
      el.style.setProperty('--gx', `${(g / 20) * 12}px`);
      el.style.setProperty('--gy', `${(b / 20) * 12}px`);
    };
    window.addEventListener('deviceorientation', on);
    return () => window.removeEventListener('deviceorientation', on);
  }, [ref]);
}
