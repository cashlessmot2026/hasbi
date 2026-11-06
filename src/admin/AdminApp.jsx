import { useCallback, useEffect, useMemo, useState } from 'react';
import { imgUrl, money } from '../lib/format.js';
import { login, loadAll, save, remove, changePassword, getPass, setPass } from './api.js';
import { ProductEditor, CategoryEditor, BannerEditor, LocationEditor, MapPreview, Field } from './editors.jsx';
import './admin.css';

const TABS = [
  { id: 'products', label: 'Productos', icon: '🍽️' },
  { id: 'categories', label: 'Categorías', icon: '🗂️' },
  { id: 'banners', label: 'Banners', icon: '🖼️' },
  { id: 'locations', label: 'Ubicaciones', icon: '📍' },
  { id: 'settings', label: 'Negocio', icon: '🏪' },
  { id: 'orders', label: 'Pedidos', icon: '🧾' },
  { id: 'security', label: 'Clave', icon: '🔒' },
];
const PAY = { efectivo: 'Efectivo', nequi: 'Nequi', daviplata: 'Daviplata', transferencia: 'Transferencia', tarjeta: 'Tarjeta' };

export default function AdminApp() {
  const [authed, setAuthed] = useState(!!getPass());
  useEffect(() => {
    document.title = 'Hasbi · Admin';
    document.documentElement.lang = 'es'; document.documentElement.dir = 'ltr';
    const m = document.createElement('meta'); m.name = 'robots'; m.content = 'noindex, nofollow'; document.head.appendChild(m);
  }, []);
  return authed ? <Panel onLogout={() => { setPass(''); setAuthed(false); }} /> : <Login onOk={() => setAuthed(true)} />;
}

function Login({ onOk }) {
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    try { await login(pin); onOk(); } catch (x) { setErr(x.message); setPin(''); } finally { setBusy(false); }
  };
  return (
    <div className="alogin">
      <form onSubmit={submit} className="alogin__card">
        <div className="alogo">H</div>
        <h1>Panel de administración</h1>
        <p>Ingresa la clave para continuar</p>
        <input type="password" inputMode="numeric" autoComplete="current-password" autoFocus value={pin}
          onChange={(e) => setPin(e.target.value)} placeholder="••••" aria-label="Clave" />
        {err && <p className="aerr">{err}</p>}
        <button className="abtn primary block" disabled={busy || !pin}>{busy ? 'Verificando…' : 'Entrar'}</button>
        <a href={import.meta.env.BASE_URL} className="alink">← Volver al menú</a>
      </form>
    </div>
  );
}

function Panel({ onLogout }) {
  const [tab, setTab] = useState(() => location.hash.replace('#', '') || 'products');
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [edit, setEdit] = useState(null); // { type, item }
  const [toast, setToast] = useState('');
  const [q, setQ] = useState('');
  const [catFilter, setCatFilter] = useState('');

  const refresh = useCallback(async () => {
    try { setData(await loadAll()); setErr(''); }
    catch (e) { if (/clave|intentos/i.test(e.message)) onLogout(); else setErr(e.message); }
  }, [onLogout]);
  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => { history.replaceState(null, '', `#${tab}`); }, [tab]);

  const flash = (m) => { setToast(m); setTimeout(() => setToast(''), 2200); };
  const saved = (m = 'Guardado ✓') => { setEdit(null); flash(m); refresh(); };
  const quick = async (entity, rec, m) => { try { await save(entity, rec); flash(m); refresh(); } catch (e) { flash(`⚠️ ${e.message}`); } };
  const del = async (entity, id) => { try { await remove(entity, id); flash('Eliminado'); refresh(); } catch (e) { flash(`⚠️ ${e.message}`); } };

  const products = useMemo(() => (data?.products || []).filter((p) =>
    (!catFilter || p.categories.includes(catFilter)) && (!q || `${p.name} ${p.description}`.toLowerCase().includes(q.toLowerCase()))
  ), [data, q, catFilter]);

  if (!data) return <div className="aloading">{err ? <p className="aerr">{err}</p> : <span className="aspin" />}</div>;
  const catName = (id) => data.categories.find((c) => c.id === id)?.name || id;

  return (
    <div className="admin">
      <aside className="aside">
        <div className="aside__brand"><div className="alogo sm">H</div><div><b>{data.settings?.business_name}</b><small>Administración</small></div></div>
        <nav>
          {TABS.map((t) => (
            <button key={t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>
              <span>{t.icon}</span>{t.label}
              {t.id === 'products' && <i>{data.products.length}</i>}
              {t.id === 'orders' && <i>{data.orders.length}</i>}
            </button>
          ))}
        </nav>
        <div className="aside__foot">
          <a href={import.meta.env.BASE_URL} target="_blank" rel="noopener noreferrer">↗ Ver menú público</a>
          <button onClick={onLogout}>Cerrar sesión</button>
        </div>
      </aside>

      <main className="amain">
        {tab === 'products' && (
          <section>
            <Head title="Productos" sub={`${data.products.length} productos · ${data.products.filter((p) => !p.active).length} ocultos`}
              action={<button className="abtn primary" onClick={() => setEdit({ type: 'product' })}>＋ Nuevo producto</button>} />
            <div className="afilters">
              <input placeholder="Buscar producto…" value={q} onChange={(e) => setQ(e.target.value)} />
              <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
                <option value="">Todas las categorías</option>
                {data.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="alist">
              {products.map((p) => (
                <Row key={p.id} faded={!p.active}
                  img={p.images?.[0]} title={p.name}
                  meta={<>{p.categories.map(catName).join(' · ')} · {p.images?.length || 0} foto(s)
                    {p.featured && <em className="atag">Destacado</em>}{p.upsell && <em className="atag">Sugerido</em>}{!p.active && <em className="atag off">Oculto</em>}</>}
                  right={<b className="aprice">{money(p.price)}</b>}
                  onEdit={() => setEdit({ type: 'product', item: p })}
                  onToggle={() => quick('products', { ...p, active: !p.active }, p.active ? 'Producto oculto' : 'Producto visible')}
                  active={p.active}
                  onDelete={() => del('products', p.id)} />
              ))}
              {!products.length && <p className="aempty">No hay productos con ese filtro.</p>}
            </div>
          </section>
        )}

        {tab === 'categories' && (
          <section>
            <Head title="Categorías" sub="Organizan el menú" action={<button className="abtn primary" onClick={() => setEdit({ type: 'category' })}>＋ Nueva categoría</button>} />
            <div className="alist">
              {data.categories.map((c) => (
                <Row key={c.id} faded={!c.active} emoji={c.emoji} title={c.name}
                  meta={`${data.products.filter((p) => p.categories.includes(c.id)).length} productos · orden ${c.sort}`}
                  onEdit={() => setEdit({ type: 'category', item: c })} active={c.active}
                  onToggle={() => quick('categories', { ...c, active: !c.active }, 'Actualizado')}
                  onDelete={() => del('categories', c.id)} />
              ))}
            </div>
          </section>
        )}

        {tab === 'banners' && (
          <section>
            <Head title="Banners" sub="Se muestran en la parte superior del menú. Si no hay banners, se muestran los productos destacados."
              action={<button className="abtn primary" onClick={() => setEdit({ type: 'banner' })}>＋ Nuevo banner</button>} />
            <div className="abanners">
              {data.banners.map((b) => (
                <article key={b.id} className={`abanner ${b.active ? '' : 'faded'}`}>
                  <img src={imgUrl(b.image_url)} alt="" />
                  <div><b>{b.title || 'Sin título'}</b><small>{b.subtitle}</small>
                    {b.product_id && <small>→ {data.products.find((p) => p.id === b.product_id)?.name}</small>}</div>
                  <Actions active={b.active} onEdit={() => setEdit({ type: 'banner', item: b })}
                    onToggle={() => quick('banners', { ...b, active: !b.active }, 'Actualizado')} onDelete={() => del('banners', b.id)} />
                </article>
              ))}
              {!data.banners.length && <p className="aempty">Aún no hay banners. Crea el primero.</p>}
            </div>
          </section>
        )}

        {tab === 'locations' && (
          <section>
            <Head title="Ubicaciones" sub="Sedes del negocio. Aparecen en el menú con botón “Cómo llegar”."
              action={<button className="abtn primary" onClick={() => setEdit({ type: 'location' })}>＋ Agregar ubicación</button>} />
            <div className="alocs">
              {data.locations.map((l) => (
                <article key={l.id} className={`aloc ${l.active ? '' : 'faded'}`}>
                  <MapPreview lat={l.latitude} lng={l.longitude} height={160} />
                  <div className="aloc__body">
                    <b>{l.name}</b>
                    <small>{[l.address, l.city].filter(Boolean).join(', ') || 'Sin dirección'}</small>
                    {l.phone && <small>📞 {l.phone}</small>}{l.hours && <small>🕒 {l.hours}</small>}
                  </div>
                  <Actions active={l.active} onEdit={() => setEdit({ type: 'location', item: l })}
                    onToggle={() => quick('locations', { ...l, active: !l.active }, 'Actualizado')} onDelete={() => del('locations', l.id)} />
                </article>
              ))}
              {!data.locations.length && <p className="aempty">Aún no hay ubicaciones. Agrega la primera sede.</p>}
            </div>
          </section>
        )}

        {tab === 'settings' && <Settings settings={data.settings} onSaved={() => saved('Datos del negocio guardados ✓')} />}

        {tab === 'orders' && (
          <section>
            <Head title="Pedidos" sub="Últimos 100 pedidos recibidos" action={<button className="abtn" onClick={refresh}>↻ Actualizar</button>} />
            <div className="aorders">
              {data.orders.map((o) => (
                <article key={o.id} className="aorder">
                  <header><b>{o.order_code}</b><span>{new Date(o.created_at).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}</span></header>
                  <p><b>{o.customer_name}</b> · {o.customer_phone || '—'} · {o.order_type}{o.payment_method && ` · ${PAY[o.payment_method] || o.payment_method}`}{o.language && o.language !== 'es' && ` · 🌐 ${o.language}`}</p>
                  {o.address && <p className="amuted">{o.address}</p>}
                  <p className="amuted">{(o.items || []).map((i) => `${i.qty}× ${i.name}`).join(' · ')}</p>
                  <footer>
                    <b className="aprice">{money(o.total)}</b>
                    <div className="arow">
                      {o.maps_url && <a className="abtn sm" href={o.maps_url} target="_blank" rel="noopener noreferrer">📍 Mapa</a>}
                      {o.ticket_url && <a className="abtn sm" href={o.ticket_url} target="_blank" rel="noopener noreferrer">🎟️ Ticket</a>}
                      {o.customer_phone && <a className="abtn sm" href={`https://api.whatsapp.com/send?phone=${o.customer_phone.replace(/\D/g, '').replace(/^(?!57)(\d{10})$/, '57$1')}`} target="_blank" rel="noopener noreferrer">💬 Cliente</a>}
                    </div>
                  </footer>
                </article>
              ))}
              {!data.orders.length && <p className="aempty">Aún no hay pedidos.</p>}
            </div>
          </section>
        )}

        {tab === 'security' && <Security onDone={(m) => flash(m)} />}
      </main>

      {edit?.type === 'product' && <ProductEditor product={edit.item} categories={data.categories} existingIds={data.products.map((p) => p.id)} onSaved={() => saved()} onClose={() => setEdit(null)} />}
      {edit?.type === 'category' && <CategoryEditor category={edit.item} existingIds={data.categories.map((c) => c.id)} onSaved={() => saved()} onClose={() => setEdit(null)} />}
      {edit?.type === 'banner' && <BannerEditor banner={edit.item} products={data.products} onSaved={() => saved()} onClose={() => setEdit(null)} />}
      {edit?.type === 'location' && <LocationEditor location={edit.item} onSaved={() => saved()} onClose={() => setEdit(null)} />}
      {toast && <div className="atoast">{toast}</div>}
    </div>
  );
}

const Head = ({ title, sub, action }) => (
  <header className="ahead"><div><h1>{title}</h1>{sub && <p>{sub}</p>}</div>{action}</header>
);

function Actions({ active, onEdit, onToggle, onDelete }) {
  const [confirm, setConfirm] = useState(false);
  if (confirm) return (
    <div className="aactions confirm">
      <span>¿Eliminar?</span>
      <button className="abtn sm danger" onClick={() => { setConfirm(false); onDelete(); }}>Sí, eliminar</button>
      <button className="abtn sm ghost" onClick={() => setConfirm(false)}>No</button>
    </div>
  );
  return (
    <div className="aactions">
      <button className="abtn sm" onClick={onEdit}>✏️ Editar</button>
      <button className="abtn sm ghost" onClick={onToggle} title={active ? 'Ocultar' : 'Mostrar'}>{active ? '👁️' : '🚫'}</button>
      <button className="abtn sm ghost" onClick={() => setConfirm(true)} title="Eliminar">🗑️</button>
    </div>
  );
}

const Row = ({ img, emoji, title, meta, right, faded, ...a }) => (
  <article className={`arow-item ${faded ? 'faded' : ''}`}>
    {img ? <img src={imgUrl(img)} alt="" /> : <span className="aemoji">{emoji}</span>}
    <div className="arow-item__txt"><b>{title}</b><small>{meta}</small></div>
    {right}
    <Actions {...a} />
  </article>
);

function Settings({ settings, onSaved }) {
  const [s, setS] = useState(settings);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const set = (k) => (e) => setS({ ...s, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    try { await save('settings', { ...s, whatsapp: String(s.whatsapp).replace(/\D/g, '') }); onSaved(); } catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  return (
    <section>
      <Head title="Datos del negocio" sub="Nombre, eslogan y el WhatsApp que recibe los pedidos." />
      <form className="acard agrid" onSubmit={submit}>
        <Field label="Nombre del negocio"><input value={s.business_name} onChange={set('business_name')} /></Field>
        <Field label="Eslogan"><input value={s.tagline} onChange={set('tagline')} /></Field>
        <Field label="WhatsApp que recibe los pedidos *" hint="Solo números con indicativo de país. Ej: 573232252945">
          <input value={s.whatsapp} onChange={set('whatsapp')} inputMode="numeric" />
        </Field>
        <Field label="Teléfono como se muestra"><input value={s.phone_label} onChange={set('phone_label')} placeholder="+57 323 225 2945" /></Field>
        <Field label="Horario general"><input value={s.hours || ''} onChange={set('hours')} placeholder="Lun–Dom 11:00 a. m. – 10:00 p. m." /></Field>
        <Field label="Instagram"><input value={s.instagram || ''} onChange={set('instagram')} placeholder="@hasbi" /></Field>
        <div className="af wide arow end">
          {err && <p className="aerr">{err}</p>}
          <a className="abtn ghost" href={`https://api.whatsapp.com/send?phone=${String(s.whatsapp).replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">Probar WhatsApp</a>
          <button className="abtn primary" disabled={busy}>{busy ? 'Guardando…' : 'Guardar cambios'}</button>
        </div>
      </form>
    </section>
  );
}

function Security({ onDone }) {
  const [a, setA] = useState(''); const [b, setB] = useState('');
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setErr('');
    if (a.length < 4) return setErr('Mínimo 4 caracteres (recomendado 8 o más)');
    if (a !== b) return setErr('Las claves no coinciden');
    setBusy(true);
    try { await changePassword(a); setPass(a); setA(''); setB(''); onDone('Clave actualizada ✓'); } catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  return (
    <section>
      <Head title="Clave de acceso" sub="La clave se valida en el servidor. Tras 5 intentos fallidos el acceso se bloquea 15 minutos." />
      <form className="acard agrid" onSubmit={submit} style={{ maxWidth: 520 }}>
        <Field label="Nueva clave" wide><input type="password" value={a} onChange={(e) => setA(e.target.value)} autoComplete="new-password" /></Field>
        <Field label="Repite la nueva clave" wide><input type="password" value={b} onChange={(e) => setB(e.target.value)} autoComplete="new-password" /></Field>
        <div className="af wide arow end">{err && <p className="aerr">{err}</p>}<button className="abtn primary" disabled={busy}>Cambiar clave</button></div>
      </form>
    </section>
  );
}
