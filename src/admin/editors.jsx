import { useRef, useState } from 'react';
import { imgUrl, money } from '../lib/format.js';
import { LANGS } from '../i18n/index.jsx';
import { save, uploadImage, slugify, geocode } from './api.js';

// ---------- piezas comunes ----------
export const Field = ({ label, hint, children, wide }) => (
  <label className={`af ${wide ? 'wide' : ''}`}>
    <span>{label}</span>
    {children}
    {hint && <small>{hint}</small>}
  </label>
);

export const Toggle = ({ checked, onChange, label }) => (
  <button type="button" className={`atoggle ${checked ? 'on' : ''}`} onClick={() => onChange(!checked)} aria-pressed={checked}>
    <i /> {label}
  </button>
);

export function Modal({ title, onClose, children, footer }) {
  return (
    <div className="amodal-bg" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="amodal" role="dialog" aria-label={title}>
        <header><h2>{title}</h2><button className="abtn ghost" onClick={onClose}>✕</button></header>
        <div className="amodal__body">{children}</div>
        {footer && <footer>{footer}</footer>}
      </div>
    </div>
  );
}

/** Gestor de varias imágenes: subir, reordenar, marcar principal, eliminar. */
export function ImageManager({ images, onChange, folder, single }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(0);
  const [err, setErr] = useState('');

  const upload = async (files) => {
    setErr('');
    const list = [...files].slice(0, single ? 1 : 12);
    setBusy(list.length);
    const urls = [];
    for (const f of list) {
      try { urls.push(await uploadImage(f, folder)); } catch (e) { setErr(e.message); }
      setBusy((n) => n - 1);
    }
    onChange(single ? urls.slice(0, 1) : [...images, ...urls]);
  };
  const move = (i, d) => { const a = [...images]; const j = i + d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; onChange(a); };

  return (
    <div className="aimgs">
      <div className="aimgs__grid"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files.length) upload(e.dataTransfer.files); }}>
        {images.map((src, i) => (
          <figure key={src + i} className={i === 0 && !single ? 'main' : ''}>
            <img src={imgUrl(src)} alt="" />
            {i === 0 && !single && <span className="badge">Principal</span>}
            <div className="aimgs__ctrl">
              {!single && <button type="button" onClick={() => move(i, -1)} disabled={i === 0} title="Mover antes">◀</button>}
              {!single && i > 0 && <button type="button" onClick={() => { const a = [...images]; a.splice(i, 1); onChange([src, ...a]); }} title="Hacer principal">★</button>}
              {!single && <button type="button" onClick={() => move(i, 1)} disabled={i === images.length - 1} title="Mover después">▶</button>}
              <button type="button" className="del" onClick={() => onChange(images.filter((_, n) => n !== i))} title="Quitar">✕</button>
            </div>
          </figure>
        ))}
        {[...Array(busy)].map((_, i) => <figure key={`b${i}`} className="loading"><span className="aspin" /></figure>)}
        {(!single || images.length === 0) && (
          <button type="button" className="aimgs__add" onClick={() => input.current.click()}>
            <b>＋</b>{single ? 'Subir imagen' : 'Agregar imágenes'}<small>o arrástralas aquí</small>
          </button>
        )}
      </div>
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" multiple={!single} hidden
        onChange={(e) => { upload(e.target.files); e.target.value = ''; }} />
      {err && <p className="aerr">{err}</p>}
    </div>
  );
}

function useSaver(onSaved) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const run = async (entity, rec) => {
    setBusy(true); setErr('');
    try { await save(entity, rec); onSaved(); } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };
  return { busy, err, setErr, run };
}

const Footer = ({ busy, err, onClose, label = 'Guardar' }) => (
  <>
    {err && <p className="aerr">{err}</p>}
    <button type="button" className="abtn ghost" onClick={onClose}>Cancelar</button>
    <button type="submit" form="aform" className="abtn primary" disabled={busy}>{busy ? 'Guardando…' : label}</button>
  </>
);

// ---------- Producto ----------
export function ProductEditor({ product, categories, existingIds, onSaved, onClose }) {
  const isNew = !product;
  const [p, setP] = useState(() => product ? { ...product, tagsText: (product.tags || []).join(', ') } : {
    id: '', name: '', description: '', price: '', categories: [], images: [], tags: [], tagsText: '',
    featured: false, upsell: false, active: true, sort: 0, i18n: {},
  });
  const s = useSaver(onSaved);
  const set = (k) => (e) => setP({ ...p, [k]: e?.target ? e.target.value : e });
  const toggleCat = (id) => setP({ ...p, categories: p.categories.includes(id) ? p.categories.filter((c) => c !== id) : [...p.categories, id] });
  const setTr = (lang, k, v) => setP({ ...p, i18n: { ...p.i18n, [lang]: { ...(p.i18n?.[lang] || {}), [k]: v } } });

  const submit = (e) => {
    e.preventDefault();
    const price = Number(String(p.price).replace(/\D/g, ''));
    if (!p.name.trim()) return s.setErr('Escribe el nombre');
    if (!price) return s.setErr('Escribe el precio');
    if (!p.categories.length) return s.setErr('Elige al menos una categoría');
    let id = p.id || slugify(p.name);
    if (isNew) { let n = 2; const base = id; while (existingIds.includes(id)) id = `${base}-${n++}`; }
    const { tagsText, ...rest } = p;
    const i18n = Object.fromEntries(Object.entries(p.i18n || {}).filter(([, v]) => v?.name || v?.description));
    s.run('products', {
      ...rest, id, price, name: p.name.trim(), description: p.description.trim(), i18n,
      tags: tagsText.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean), sort: Number(p.sort) || 0,
    });
  };

  return (
    <Modal title={isNew ? 'Nuevo producto' : `Editar · ${product.name}`} onClose={onClose} footer={<Footer {...s} onClose={onClose} />}>
      <form id="aform" onSubmit={submit} className="agrid">
        <Field label="Imágenes (la primera es la principal)" wide>
          <ImageManager images={p.images} onChange={(images) => setP({ ...p, images })} folder="products" />
        </Field>
        <Field label="Nombre *"><input value={p.name} onChange={set('name')} placeholder="Shawarma de pollo" /></Field>
        <Field label="Precio (COP) *" hint={p.price ? money(Number(String(p.price).replace(/\D/g, ''))) : ''}>
          <input value={p.price} onChange={set('price')} inputMode="numeric" placeholder="33000" />
        </Field>
        <Field label="Descripción" wide><textarea rows={3} value={p.description || ''} onChange={set('description')} placeholder="Ingredientes, porción…" /></Field>
        <Field label="Categorías *" wide>
          <div className="achips">
            {categories.map((c) => (
              <button type="button" key={c.id} className={p.categories.includes(c.id) ? 'on' : ''} onClick={() => toggleCat(c.id)}>{c.emoji} {c.name}</button>
            ))}
          </div>
        </Field>
        <Field label="Etiquetas" hint="Separadas por coma. Ej: vegetariano, vegano, para compartir">
          <input value={p.tagsText} onChange={set('tagsText')} />
        </Field>
        <Field label="Orden" hint="Menor número = aparece primero"><input type="number" value={p.sort} onChange={set('sort')} /></Field>
        <div className="af wide atoggles">
          <Toggle checked={p.active} onChange={set('active')} label="Visible en el menú" />
          <Toggle checked={p.featured} onChange={set('featured')} label="Destacado / popular" />
          <Toggle checked={p.upsell} onChange={set('upsell')} label="Sugerir antes de finalizar" />
        </div>
        <details className="af wide atr">
          <summary>Traducciones (opcional) — si se dejan vacías se usan las traducciones incluidas o el español</summary>
          {LANGS.filter((l) => l.code !== 'es').map((l) => (
            <div key={l.code} className="atr__row" dir={l.rtl ? 'rtl' : 'ltr'}>
              <b>{l.flag} {l.sub || l.label}</b>
              <input value={p.i18n?.[l.code]?.name || ''} onChange={(e) => setTr(l.code, 'name', e.target.value)} placeholder="Nombre" />
              <input value={p.i18n?.[l.code]?.description || ''} onChange={(e) => setTr(l.code, 'description', e.target.value)} placeholder="Descripción" />
            </div>
          ))}
        </details>
      </form>
    </Modal>
  );
}

// ---------- Categoría ----------
export function CategoryEditor({ category, existingIds, onSaved, onClose }) {
  const isNew = !category;
  const [c, setC] = useState(category || { id: '', name: '', emoji: '🍽️', sort: 10, active: true, i18n: {} });
  const s = useSaver(onSaved);
  const submit = (e) => {
    e.preventDefault();
    if (!c.name.trim()) return s.setErr('Escribe el nombre');
    let id = c.id || slugify(c.name);
    if (isNew && existingIds.includes(id)) id = `${id}-2`;
    s.run('categories', { ...c, id, name: c.name.trim(), sort: Number(c.sort) || 0 });
  };
  return (
    <Modal title={isNew ? 'Nueva categoría' : `Editar · ${category.name}`} onClose={onClose} footer={<Footer {...s} onClose={onClose} />}>
      <form id="aform" onSubmit={submit} className="agrid">
        <Field label="Nombre *"><input value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} /></Field>
        <Field label="Emoji"><input value={c.emoji || ''} onChange={(e) => setC({ ...c, emoji: e.target.value })} maxLength={4} /></Field>
        <Field label="Orden"><input type="number" value={c.sort} onChange={(e) => setC({ ...c, sort: e.target.value })} /></Field>
        <div className="af atoggles"><Toggle checked={c.active} onChange={(v) => setC({ ...c, active: v })} label="Visible" /></div>
      </form>
    </Modal>
  );
}

// ---------- Banner ----------
export function BannerEditor({ banner, products, onSaved, onClose }) {
  const [b, setB] = useState(banner || { title: '', subtitle: '', image_url: '', product_id: '', active: true, sort: 0 });
  const s = useSaver(onSaved);
  const submit = (e) => {
    e.preventDefault();
    if (!b.image_url) return s.setErr('Sube una imagen para el banner');
    s.run('banners', { ...b, product_id: b.product_id || null, sort: Number(b.sort) || 0 });
  };
  return (
    <Modal title={banner ? 'Editar banner' : 'Nuevo banner'} onClose={onClose} footer={<Footer {...s} onClose={onClose} />}>
      <form id="aform" onSubmit={submit} className="agrid">
        <Field label="Imagen * (recomendado horizontal, 1600×700)" wide>
          <ImageManager single images={b.image_url ? [b.image_url] : []} onChange={([u]) => setB({ ...b, image_url: u || '' })} folder="banners" />
        </Field>
        <Field label="Título"><input value={b.title || ''} onChange={(e) => setB({ ...b, title: e.target.value })} placeholder="¡Nuevo! Bowl de cheddar" /></Field>
        <Field label="Subtítulo"><input value={b.subtitle || ''} onChange={(e) => setB({ ...b, subtitle: e.target.value })} placeholder="Solo esta semana" /></Field>
        <Field label="Al tocar, abrir producto">
          <select value={b.product_id || ''} onChange={(e) => setB({ ...b, product_id: e.target.value })}>
            <option value="">— Ninguno —</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>
        <Field label="Orden"><input type="number" value={b.sort} onChange={(e) => setB({ ...b, sort: e.target.value })} /></Field>
        <div className="af wide atoggles"><Toggle checked={b.active} onChange={(v) => setB({ ...b, active: v })} label="Visible" /></div>
      </form>
    </Modal>
  );
}

// ---------- Ubicación / sede ----------
export function MapPreview({ lat, lng, height = 220 }) {
  if (lat == null || lng == null || lat === '' || lng === '') return <div className="amap empty" style={{ height }}>Sin coordenadas todavía</div>;
  const d = 0.004;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d}%2C${lat - d}%2C${Number(lng) + d}%2C${Number(lat) + d}&layer=mapnik&marker=${lat}%2C${lng}`;
  return <iframe className="amap" title="Mapa" src={src} style={{ height }} loading="lazy" />;
}

export function LocationEditor({ location, onSaved, onClose }) {
  const [l, setL] = useState(location || { name: '', address: '', city: '', latitude: '', longitude: '', phone: '', hours: '', active: true, sort: 0 });
  const [geo, setGeo] = useState('');
  const s = useSaver(onSaved);
  const set = (k) => (e) => setL({ ...l, [k]: e.target.value });

  const fromGps = () => {
    setGeo('Obteniendo ubicación…');
    navigator.geolocation?.getCurrentPosition(
      (pos) => { setL((x) => ({ ...x, latitude: +pos.coords.latitude.toFixed(6), longitude: +pos.coords.longitude.toFixed(6) })); setGeo(`Ubicación actual (±${Math.round(pos.coords.accuracy)} m)`); },
      (err) => setGeo(err.code === 1 ? 'Permiso de ubicación denegado. Actívalo en el navegador.' : 'No se pudo obtener la ubicación.'),
      { enableHighAccuracy: true, timeout: 20000 }
    );
  };
  const fromAddress = async () => {
    const q = [l.address, l.city, 'Colombia'].filter(Boolean).join(', ');
    if (!l.address) return setGeo('Escribe primero la dirección');
    setGeo('Buscando dirección…');
    try { const r = await geocode(q); setL((x) => ({ ...x, latitude: +r.lat.toFixed(6), longitude: +r.lng.toFixed(6) })); setGeo(`Encontrado: ${r.label}`); }
    catch (e) { setGeo(e.message); }
  };
  const submit = (e) => {
    e.preventDefault();
    if (!l.name.trim()) return s.setErr('Escribe el nombre de la sede');
    const num = (v) => (v === '' || v == null ? null : Number(v));
    s.run('locations', { ...l, latitude: num(l.latitude), longitude: num(l.longitude), sort: Number(l.sort) || 0 });
  };

  return (
    <Modal title={location ? `Editar · ${location.name}` : 'Nueva ubicación'} onClose={onClose} footer={<Footer {...s} onClose={onClose} />}>
      <form id="aform" onSubmit={submit} className="agrid">
        <Field label="Nombre de la sede *"><input value={l.name} onChange={set('name')} placeholder="Hasbi Chapinero" /></Field>
        <Field label="Ciudad"><input value={l.city || ''} onChange={set('city')} placeholder="Bogotá" /></Field>
        <Field label="Dirección" wide><input value={l.address || ''} onChange={set('address')} placeholder="Calle 60 # 9-23" /></Field>
        <div className="af wide">
          <span>Ubicación en el mapa</span>
          <div className="arow">
            <button type="button" className="abtn" onClick={fromGps}>📍 Usar mi ubicación actual</button>
            <button type="button" className="abtn" onClick={fromAddress}>🔎 Buscar por dirección</button>
          </div>
          {geo && <small>{geo}</small>}
        </div>
        <Field label="Latitud"><input value={l.latitude ?? ''} onChange={set('latitude')} inputMode="decimal" placeholder="4.6486" /></Field>
        <Field label="Longitud"><input value={l.longitude ?? ''} onChange={set('longitude')} inputMode="decimal" placeholder="-74.0628" /></Field>
        <div className="af wide"><MapPreview lat={l.latitude} lng={l.longitude} /></div>
        <Field label="Teléfono de la sede"><input value={l.phone || ''} onChange={set('phone')} placeholder="+57 323 225 2945" /></Field>
        <Field label="Horario"><input value={l.hours || ''} onChange={set('hours')} placeholder="Lun–Dom 11:00 a. m. – 10:00 p. m." /></Field>
        <Field label="Orden"><input type="number" value={l.sort} onChange={set('sort')} /></Field>
        <div className="af atoggles"><Toggle checked={l.active} onChange={(v) => setL({ ...l, active: v })} label="Visible" /></div>
      </form>
    </Modal>
  );
}
