import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { loadMenu, uploadTicket, saveOrder } from './lib/supabase.js';
import { CATEGORIES, PRODUCTS } from './data/menu.js';
import { money, imgUrl, orderCode, dateLabel } from './lib/format.js';
import { renderTicket } from './lib/ticket.js';
import { buildMessage, whatsappUrl } from './lib/whatsapp.js';
import { useMotion } from './lib/motion.js';
import ProductCard from './components/ProductCard.jsx';
import ProductDetail from './components/ProductDetail.jsx';
import CartView from './components/CartView.jsx';
import UpsellSheet from './components/UpsellSheet.jsx';
import TicketModal from './components/TicketModal.jsx';
import { IconHome, IconCart, IconReceipt, IconStar, IconSearch, IconClose, IconInstall, IconWhatsApp } from './components/Icons.jsx';
import { BUSINESS } from './config.js';

// ---------- estado persistente ----------
function useStored(key, initial) {
  const [v, setV] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : initial; } catch { return initial; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(v)); } catch {} }, [key, v]);
  return [v, setV];
}

const EMPTY_CUSTOMER = { name: '', phone: '', type: 'domicilio', address: '', notes: '' };
const isStandalone = () => window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone;

export default function App() {
  const [menu, setMenu] = useState({ categories: CATEGORIES, products: PRODUCTS, source: 'local' });
  const [view, setView] = useState('home');
  const [cat, setCat] = useState('all');
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [cart, setCart] = useStored('hasbi.cart', {});            // { productId: qty }
  const [favs, setFavs] = useStored('hasbi.favs', []);
  const [history, setHistory] = useStored('hasbi.orders', []);
  const [customer, setCustomer] = useStored('hasbi.customer', EMPTY_CUSTOMER);
  const [upsell, setUpsell] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [toast, setToast] = useState(null);
  const [installEvt, setInstallEvt] = useState(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const cartBtn = useRef(null);

  useEffect(() => { loadMenu().then(setMenu); }, []);

  useEffect(() => {
    const on = (e) => { e.preventDefault(); setInstallEvt(e); };
    window.addEventListener('beforeinstallprompt', on);
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !isStandalone();
    let dismissed = false; try { dismissed = !!localStorage.getItem('hasbi.iosHint'); } catch {}
    if (ios && !dismissed) setTimeout(() => setShowIosHint(true), 2500);
    return () => window.removeEventListener('beforeinstallprompt', on);
  }, []);

  useEffect(() => { window.scrollTo({ top: 0 }); }, [view]);
  useEffect(() => { document.body.style.overflow = detail || upsell || result ? 'hidden' : ''; }, [detail, upsell, result]);

  const byId = useMemo(() => Object.fromEntries(menu.products.map((p) => [p.id, p])), [menu.products]);
  const lines = useMemo(
    () => Object.entries(cart).filter(([id, q]) => byId[id] && q > 0).map(([id, qty]) => ({ product: byId[id], qty })),
    [cart, byId]
  );
  const total = lines.reduce((s, l) => s + l.product.price * l.qty, 0);
  const count = lines.reduce((s, l) => s + l.qty, 0);

  const flash = (msg) => { setToast(msg); clearTimeout(flash.t); flash.t = setTimeout(() => setToast(null), 1800); };

  const flyToCart = (from, src) => {
    const to = cartBtn.current; if (!from || !to || !src) return;
    const a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
    const el = document.createElement('img');
    el.src = src; el.className = 'fly';
    el.style.left = `${a.left + a.width / 2 - 22}px`; el.style.top = `${a.top + a.height / 2 - 22}px`;
    document.body.appendChild(el);
    requestAnimationFrame(() => {
      el.style.transform = `translate(${b.left + b.width / 2 - (a.left + a.width / 2)}px, ${b.top - (a.top + a.height / 2)}px) scale(.3)`;
      el.style.opacity = '0.4';
    });
    setTimeout(() => { el.remove(); to.classList.remove('bump'); void to.offsetWidth; to.classList.add('bump'); }, 650);
  };

  const add = useCallback((p, fromEl, qty = 1) => {
    setCart((c) => ({ ...c, [p.id]: (c[p.id] || 0) + qty }));
    flyToCart(fromEl, imgUrl(p.images[0]));
    flash(`${qty > 1 ? qty + ' × ' : ''}${p.name} agregado`);
  }, [setCart]);
  const setQty = (id, q) => setCart((c) => { const n = { ...c }; if (q <= 0) delete n[id]; else n[id] = q; return n; });
  const toggleFav = (id) => setFavs((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));

  // ---------- catálogo ----------
  const q = query.trim().toLowerCase();
  const filtered = menu.products.filter((p) =>
    (cat === 'all' || p.categories.includes(cat)) &&
    (!q || `${p.name} ${p.description}`.toLowerCase().includes(q))
  );
  const featured = menu.products.filter((p) => p.featured);
  const upsellPool = menu.products.filter((p) => p.upsell);
  const suggestions = [...upsellPool.filter((p) => !cart[p.id]), ...upsellPool.filter((p) => cart[p.id])].slice(0, 6);
  const pairingsFor = (p) => upsellPool.filter((x) => x.id !== p.id).slice(0, 5);

  // ---------- checkout ----------
  const finalize = async () => {
    setBusy(true);
    // Se abre la pestaña dentro del gesto del usuario para evitar el bloqueo de ventanas emergentes.
    const win = isStandalone() ? null : window.open('', '_blank');
    if (win) win.document.write('<p style="font:16px system-ui;padding:24px">Abriendo WhatsApp…</p>');

    const order = {
      order_code: orderCode(),
      date_label: dateLabel(),
      customer_name: customer.name.trim(),
      customer_phone: customer.phone.trim() || null,
      order_type: customer.type,
      address: customer.type === 'recoger' ? null : customer.address.trim() || null,
      notes: customer.notes.trim() || null,
      items: lines.map(({ product: p, qty }) => ({ id: p.id, name: p.name, price: p.price, qty, subtotal: p.price * qty })),
      total,
      ticket_url: null,
    };
    try {
      const blob = await renderTicket(order);
      try { order.ticket_url = await uploadTicket(blob, order.order_code); } catch (e) { console.warn('[Hasbi] ticket no subido:', e?.message); }
      const waUrl = whatsappUrl(buildMessage(order));
      const { date_label, ...row } = order;
      saveOrder(row).catch((e) => console.warn('[Hasbi] pedido no guardado:', e?.message));

      if (win) win.location.href = waUrl; else window.location.href = waUrl;

      setHistory((h) => [{ ...order, waUrl, created_at: new Date().toISOString() }, ...h].slice(0, 30));
      setCart({});
      setCustomer((c) => ({ ...c, notes: '' }));
      setUpsell(false);
      setResult({ blob, waUrl, order });
      setView('orders');
    } catch (e) {
      win?.close();
      flash('No se pudo generar el ticket. Intenta de nuevo.');
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const install = async () => {
    if (!installEvt) return;
    installEvt.prompt();
    await installEvt.userChoice.catch(() => {});
    setInstallEvt(null);
  };

  return (
    <div className="app">
      <main className="screen">
        {view === 'home' && (
          <>
            <header className="topbar">
              {searchOpen ? (
                <div className="search">
                  <IconSearch width={18} />
                  <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Busca shawarma, falafel, hummus…" />
                  <button className="icon-btn sm ghost" onClick={() => { setQuery(''); setSearchOpen(false); }} aria-label="Cerrar búsqueda"><IconClose width={18} /></button>
                </div>
              ) : (
                <>
                  <button className="icon-btn" onClick={() => setSearchOpen(true)} aria-label="Buscar"><IconSearch /></button>
                  <div className="hello">
                    {installEvt ? (
                      <button className="install" onClick={install}><IconInstall width={18} /> Instalar app</button>
                    ) : <span>¡Hola! 👋</span>}
                    <div className="logo-badge">H</div>
                  </div>
                </>
              )}
            </header>

            {!q && (
              <>
                <div className="brand">
                  <h1>{BUSINESS.name}</h1>
                  <p>{BUSINESS.tagline}</p>
                </div>
                <Hero items={featured} onOpen={setDetail} />
              </>
            )}

            <h2 className="section-title">Categorías</h2>
            <nav className="chips" aria-label="Categorías">
              <button className={cat === 'all' ? 'on' : ''} onClick={() => setCat('all')}>Todo</button>
              {menu.categories.map((c) => (
                <button key={c.id} className={cat === c.id ? 'on' : ''} onClick={() => setCat(c.id)}>
                  <span>{c.emoji}</span> {c.name}
                </button>
              ))}
            </nav>

            {cat === 'all' && !q && (
              <>
                <h2 className="section-title">Populares ahora</h2>
                <div className="hscroll">
                  {featured.map((p) => (
                    <ProductCard key={p.id} variant="h" product={p} onOpen={setDetail} onAdd={add}
                      fav={favs.includes(p.id)} onFav={toggleFav} inCart={cart[p.id]} />
                  ))}
                </div>
              </>
            )}

            {cat === 'all' && !q ? (
              menu.categories.map((c) => {
                const list = menu.products.filter((p) => p.categories.includes(c.id));
                if (!list.length) return null;
                return (
                  <section key={c.id} className="cat-section">
                    <h2 className="section-title">
                      <span>{c.emoji} {c.name}</span>
                      <button className="see-more" onClick={() => { setCat(c.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Ver todo</button>
                    </h2>
                    <div className="grid">
                      {list.map((p) => (
                        <ProductCard key={p.id} product={p} onOpen={setDetail} onAdd={add}
                          fav={favs.includes(p.id)} onFav={toggleFav} inCart={cart[p.id]} />
                      ))}
                    </div>
                  </section>
                );
              })
            ) : (
              <section className="cat-section">
                <h2 className="section-title">{q ? `Resultados (${filtered.length})` : menu.categories.find((c) => c.id === cat)?.name}</h2>
                {filtered.length ? (
                  <div className="grid">
                    {filtered.map((p) => (
                      <ProductCard key={p.id} product={p} onOpen={setDetail} onAdd={add}
                        fav={favs.includes(p.id)} onFav={toggleFav} inCart={cart[p.id]} />
                    ))}
                  </div>
                ) : <p className="muted pad">No encontramos productos con “{query}”.</p>}
              </section>
            )}

            <footer className="foot">
              <a href={`https://wa.me/${BUSINESS.whatsapp}`} target="_blank" rel="noopener noreferrer"><IconWhatsApp width={18} /> {BUSINESS.whatsappLabel}</a>
              <span>Precios en pesos colombianos (COP)</span>
            </footer>
          </>
        )}

        {view === 'cart' && (
          <CartView lines={lines} total={total} setQty={setQty} remove={(id) => setQty(id, 0)}
            customer={customer} setCustomer={setCustomer} onCheckout={() => setUpsell(true)} onBrowse={() => setView('home')} />
        )}

        {view === 'favs' && (
          <section>
            <h1 className="page-title">Favoritos</h1>
            {favs.filter((id) => byId[id]).length ? (
              <div className="grid">
                {favs.filter((id) => byId[id]).map((id) => (
                  <ProductCard key={id} product={byId[id]} onOpen={setDetail} onAdd={add} fav onFav={toggleFav} inCart={cart[id]} />
                ))}
              </div>
            ) : (
              <div className="empty"><div className="empty__icon"><IconStar width={40} height={40} /></div>
                <h2>Aún no tienes favoritos</h2><p>Toca la ⭐ en cualquier producto para guardarlo aquí.</p>
                <button className="btn-primary" onClick={() => setView('home')}>Explorar menú</button></div>
            )}
          </section>
        )}

        {view === 'orders' && (
          <section>
            <h1 className="page-title">Mis pedidos</h1>
            {history.length ? (
              <ul className="orders">
                {history.map((o) => (
                  <li key={o.order_code} className="order">
                    <div className="order__head"><b>{o.order_code}</b><span className="muted">{o.date_label}</span></div>
                    <p className="muted">{o.items.map((i) => `${i.qty}× ${i.name}`).join(' · ')}</p>
                    <div className="order__foot">
                      <strong className="price">{money(o.total)}</strong>
                      <div className="order__btns">
                        <button className="btn-soft sm" onClick={() => {
                          const next = {}; o.items.forEach((i) => { if (byId[i.id]) next[i.id] = i.qty; });
                          setCart(next); setView('cart');
                        }}>Repetir</button>
                        <a className="btn-soft sm wa" href={o.waUrl} target="_blank" rel="noopener noreferrer"><IconWhatsApp width={16} /> Reenviar</a>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty"><div className="empty__icon"><IconReceipt width={40} height={40} /></div>
                <h2>Sin pedidos todavía</h2><p>Tus pedidos enviados por WhatsApp aparecerán aquí.</p>
                <button className="btn-primary" onClick={() => setView('home')}>Hacer un pedido</button></div>
            )}
          </section>
        )}
      </main>

      {count > 0 && view !== 'cart' && (
        <button className="cart-bar" onClick={() => setView('cart')}>
          <span className="cart-bar__count">{count}</span>
          <span>Ver pedido</span>
          <b>{money(total)}</b>
        </button>
      )}

      <nav className="tabbar" aria-label="Navegación">
        <button className={view === 'home' ? 'on' : ''} onClick={() => setView('home')} aria-label="Inicio"><IconHome /></button>
        <button ref={cartBtn} className={view === 'cart' ? 'on' : ''} onClick={() => setView('cart')} aria-label="Pedido">
          <IconCart />{count > 0 && <i className="badge">{count}</i>}
        </button>
        <button className={view === 'orders' ? 'on' : ''} onClick={() => setView('orders')} aria-label="Mis pedidos"><IconReceipt /></button>
        <button className={view === 'favs' ? 'on' : ''} onClick={() => setView('favs')} aria-label="Favoritos"><IconStar /></button>
      </nav>

      {showIosHint && (
        <div className="ios-hint" onClick={() => { setShowIosHint(false); try { localStorage.setItem('hasbi.iosHint', '1'); } catch {} }}>
          Instala Hasbi: toca <b>Compartir</b> y luego <b>“Agregar a inicio”</b>. <span>✕</span>
        </div>
      )}

      {detail && (
        <ProductDetail product={detail} fav={favs.includes(detail.id)} onFav={toggleFav} onAdd={add}
          onClose={() => setDetail(null)} pairings={pairingsFor(detail)} onOpen={setDetail} />
      )}
      {upsell && (
        <UpsellSheet suggestions={suggestions} cartQty={(id) => cart[id] || 0} onAdd={add}
          onContinue={finalize} onClose={() => setUpsell(false)} busy={busy} />
      )}
      {result && <TicketModal result={result} onClose={() => setResult(null)} />}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

// ---------- Hero con producto destacado rotativo ----------
function Hero({ items, onOpen }) {
  const [i, setI] = useState(0);
  const ref = useMotion({ max: 5 });
  useEffect(() => {
    if (items.length < 2) return;
    const t = setInterval(() => setI((v) => (v + 1) % items.length), 4500);
    return () => clearInterval(t);
  }, [items.length]);
  const p = items[i];
  if (!p) return null;
  const [whole, cents] = money(p.price).split(/(?=\.\d{3}$)/);
  return (
    <div ref={ref} className="hero motion" onClick={() => onOpen(p)}>
      <div className="hero__img" key={p.id}><img src={imgUrl(p.images[0])} alt={p.name} /></div>
      <div className="hero__txt" key={`t${p.id}`}>
        <h2>{p.name}</h2>
        <p>{p.description}</p>
        <div className="hero__price"><small>desde</small><b>{whole}<sup>{cents}</sup></b></div>
      </div>
      <div className="hero__dots">{items.map((x, n) => <i key={x.id} className={n === i ? 'on' : ''} />)}</div>
    </div>
  );
}
