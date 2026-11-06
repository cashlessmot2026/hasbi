import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { loadMenu, uploadTicket, saveOrder } from './lib/supabase.js';
import { CATEGORIES, PRODUCTS } from './data/menu.js';
import { money, imgUrl, orderCode, dateLabel } from './lib/format.js';
import { renderTicket } from './lib/ticket.js';
import { buildMessage, whatsappUrl } from './lib/whatsapp.js';
import { useMotion } from './lib/motion.js';
import { useI18n, LANGS } from './i18n/index.jsx';
import ProductCard from './components/ProductCard.jsx';
import ProductDetail from './components/ProductDetail.jsx';
import CartView from './components/CartView.jsx';
import CheckoutView from './components/CheckoutView.jsx';
import UpsellSheet from './components/UpsellSheet.jsx';
import TicketModal from './components/TicketModal.jsx';
import {
  IconHome, IconCart, IconReceipt, IconStar, IconSearch, IconClose, IconInstall, IconWhatsApp, IconGlobe, IconCheck,
} from './components/Icons.jsx';
import { BUSINESS } from './config.js';

// ---------- estado persistente ----------
function useStored(key, initial) {
  const [v, setV] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : initial; } catch { return initial; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(v)); } catch {} }, [key, v]);
  return [v, setV];
}

const EMPTY_CUSTOMER = { name: '', phone: '', type: 'domicilio', address: '', notes: '', payment: '', cashWith: '' };
const isStandalone = () => window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone;

export default function App() {
  const { t, tp, tc, lang, setLang, meta } = useI18n();
  const [menu, setMenu] = useState({ categories: CATEGORIES, products: PRODUCTS, source: 'local' });
  const [view, setView] = useState('home'); // home | cart | checkout | orders | favs
  const [cat, setCat] = useState('all');
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [cart, setCart] = useStored('hasbi.cart', {});            // { productId: qty }
  const [favs, setFavs] = useStored('hasbi.favs', []);
  const [history, setHistory] = useStored('hasbi.orders', []);
  const [storedCustomer, setCustomer] = useStored('hasbi.customer', EMPTY_CUSTOMER);
  const customer = { ...EMPTY_CUSTOMER, ...storedCustomer };
  const [location, setLocation] = useState(null);                // GPS: no se guarda entre sesiones
  const [upsell, setUpsell] = useState(false);
  const [upsellAdded, setUpsellAdded] = useState(0);
  const [langOpen, setLangOpen] = useState(false);
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
  useEffect(() => {
    document.body.style.overflow = detail || upsell || result || langOpen ? 'hidden' : '';
  }, [detail, upsell, result, langOpen]);

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
    flash(t('added', { name: `${qty > 1 ? qty + ' × ' : ''}${tp(p).name}` }));
  }, [setCart, t, tp]);
  const setQty = (id, q) => setCart((c) => { const n = { ...c }; if (q <= 0) delete n[id]; else n[id] = q; return n; });
  const toggleFav = (id) => setFavs((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));

  // ---------- catálogo ----------
  const q = query.trim().toLowerCase();
  const filtered = menu.products.filter((p) => {
    if (cat !== 'all' && !p.categories.includes(cat)) return false;
    if (!q) return true;
    const tr = tp(p);
    return `${p.name} ${p.description} ${tr.name} ${tr.description}`.toLowerCase().includes(q);
  });
  const featured = menu.products.filter((p) => p.featured);
  const upsellPool = menu.products.filter((p) => p.upsell);
  const suggestions = [...upsellPool.filter((p) => !cart[p.id]), ...upsellPool.filter((p) => cart[p.id])].slice(0, 6);
  const pairingsFor = (p) => upsellPool.filter((x) => x.id !== p.id).slice(0, 5);

  // ---------- flujo: carrito → sugerencias → datos de entrega → WhatsApp ----------
  const openUpsell = () => { setUpsellAdded(0); setUpsell(true); };
  const upsellAdd = (p, el) => { add(p, el); setUpsellAdded((n) => n + 1); };
  const goCheckout = () => { setUpsell(false); setView('checkout'); };

  const finalize = async (loc) => {
    setBusy(true);
    // Se abre la pestaña dentro del gesto del usuario para evitar el bloqueo de ventanas emergentes.
    const win = isStandalone() ? null : window.open('', '_blank');
    if (win) win.document.write('<p style="font:16px system-ui;padding:24px">WhatsApp…</p>');

    const delivery = customer.type === 'domicilio';
    const cash = customer.payment === 'efectivo' ? Number(String(customer.cashWith).replace(/\D/g, '')) || null : null;
    const order = {
      order_code: orderCode(),
      date_label: dateLabel(),
      customer_name: customer.name.trim(),
      customer_phone: customer.phone.trim(),
      order_type: customer.type,
      address: customer.type === 'recoger' ? null : customer.address.trim() || null,
      latitude: delivery && loc ? loc.lat : null,
      longitude: delivery && loc ? loc.lng : null,
      location_accuracy: delivery && loc ? loc.acc : null,
      maps_url: delivery && loc ? `https://maps.google.com/?q=${loc.lat},${loc.lng}` : null,
      payment_method: customer.payment,
      cash_with: cash && cash >= total ? cash : null,
      notes: customer.notes.trim() || null,
      language: lang,
      // Los productos se envían en español: el pedido lo lee el restaurante.
      items: lines.map(({ product: p, qty }) => ({ id: p.id, name: p.name, price: p.price, qty, subtotal: p.price * qty })),
      total,
      ticket_url: null,
    };
    try {
      const blob = await renderTicket(order);
      try { order.ticket_url = await uploadTicket(blob, order.order_code); } catch (e) { console.warn('[Hasbi] ticket no subido:', e?.message); }
      const waUrl = whatsappUrl(buildMessage({ ...order, language_label: meta.sub || meta.label }));
      const { date_label, ...row } = order;
      saveOrder(row).catch((e) => console.warn('[Hasbi] pedido no guardado:', e?.message));

      if (win) win.location.href = waUrl; else window.location.href = waUrl;

      setHistory((h) => [{ ...order, waUrl, created_at: new Date().toISOString() }, ...h].slice(0, 30));
      setCart({});
      setCustomer((c) => ({ ...c, notes: '', cashWith: '' }));
      setResult({ blob, waUrl, order });
      setView('orders');
    } catch (e) {
      win?.close();
      flash(t('ticketError'));
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

  const catName = (id) => tc(menu.categories.find((c) => c.id === id));

  return (
    <div className="app">
      <main className="screen">
        {view === 'home' && (
          <>
            <header className="topbar">
              {searchOpen ? (
                <div className="search">
                  <IconSearch width={18} />
                  <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('searchPh')} />
                  <button className="icon-btn sm ghost" onClick={() => { setQuery(''); setSearchOpen(false); }} aria-label={t('close')}><IconClose width={18} /></button>
                </div>
              ) : (
                <>
                  <div className="topbar__left">
                    <button className="icon-btn" onClick={() => setSearchOpen(true)} aria-label={t('searchPh')}><IconSearch /></button>
                    <button className="lang-btn" onClick={() => setLangOpen(true)} aria-label={t('language')}>
                      <IconGlobe width={18} /> <span>{meta.flag}</span> <b>{lang.split('-')[0].toUpperCase()}</b>
                    </button>
                  </div>
                  <div className="hello">
                    {installEvt ? (
                      <button className="install" onClick={install}><IconInstall width={18} /> {t('install')}</button>
                    ) : <span>{t('hello')}</span>}
                    <div className="logo-badge">H</div>
                  </div>
                </>
              )}
            </header>

            {!q && (
              <>
                <div className="brand">
                  <h1>{BUSINESS.name}</h1>
                  <p>{t('tagline')}</p>
                </div>
                <Hero items={featured} onOpen={setDetail} />
              </>
            )}

            <h2 className="section-title">{t('categories')}</h2>
            <nav className="chips" aria-label={t('categories')}>
              <button className={cat === 'all' ? 'on' : ''} onClick={() => setCat('all')}>{t('all')}</button>
              {menu.categories.map((c) => (
                <button key={c.id} className={cat === c.id ? 'on' : ''} onClick={() => setCat(c.id)}>
                  <span>{c.emoji}</span> {tc(c)}
                </button>
              ))}
            </nav>

            {cat === 'all' && !q && (
              <>
                <h2 className="section-title">{t('popular')}</h2>
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
                      <span>{c.emoji} {tc(c)}</span>
                      <button className="see-more" onClick={() => { setCat(c.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>{t('seeAll')}</button>
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
                <h2 className="section-title">{q ? t('results', { n: filtered.length }) : catName(cat)}</h2>
                {filtered.length ? (
                  <div className="grid">
                    {filtered.map((p) => (
                      <ProductCard key={p.id} product={p} onOpen={setDetail} onAdd={add}
                        fav={favs.includes(p.id)} onFav={toggleFav} inCart={cart[p.id]} />
                    ))}
                  </div>
                ) : <p className="muted pad">{t('noResults', { q: query })}</p>}
              </section>
            )}

            <footer className="foot">
              <a href={`https://api.whatsapp.com/send?phone=${BUSINESS.whatsapp}`} target="_blank" rel="noopener noreferrer" dir="ltr"><IconWhatsApp width={18} /> {BUSINESS.whatsappLabel}</a>
              <span>{t('pricesNote')}</span>
            </footer>
          </>
        )}

        {view === 'cart' && (
          <CartView lines={lines} total={total} count={count} setQty={setQty} remove={(id) => setQty(id, 0)}
            onContinue={openUpsell} onBrowse={() => setView('home')} />
        )}

        {view === 'checkout' && (lines.length ? (
          <CheckoutView total={total} count={count} customer={customer} setCustomer={setCustomer}
            location={location} setLocation={setLocation} onBack={() => setView('cart')} onSubmit={finalize} busy={busy} />
        ) : (
          <CartView lines={lines} total={0} count={0} onBrowse={() => setView('home')} />
        ))}

        {view === 'favs' && (
          <section>
            <h1 className="page-title">{t('fav_title')}</h1>
            {favs.filter((id) => byId[id]).length ? (
              <div className="grid">
                {favs.filter((id) => byId[id]).map((id) => (
                  <ProductCard key={id} product={byId[id]} onOpen={setDetail} onAdd={add} fav onFav={toggleFav} inCart={cart[id]} />
                ))}
              </div>
            ) : (
              <div className="empty"><div className="empty__icon"><IconStar width={40} height={40} /></div>
                <h2>{t('fav_emptyTitle')}</h2><p>{t('fav_emptyText')}</p>
                <button className="btn-primary" onClick={() => setView('home')}>{t('explore')}</button></div>
            )}
          </section>
        )}

        {view === 'orders' && (
          <section>
            <h1 className="page-title">{t('ord_title')}</h1>
            {history.length ? (
              <ul className="orders">
                {history.map((o) => (
                  <li key={o.order_code} className="order">
                    <div className="order__head"><b dir="ltr">{o.order_code}</b><span className="muted">{o.date_label}</span></div>
                    <p className="muted">{o.items.map((i) => `${i.qty}× ${byId[i.id] ? tp(byId[i.id]).name : i.name}`).join(' · ')}</p>
                    <div className="order__foot">
                      <strong className="price">{money(o.total)}</strong>
                      <div className="order__btns">
                        <button className="btn-soft sm" onClick={() => {
                          const next = {}; o.items.forEach((i) => { if (byId[i.id]) next[i.id] = i.qty; });
                          setCart(next); setView('cart');
                        }}>{t('repeat')}</button>
                        <a className="btn-soft sm wa" href={o.waUrl} target="_blank" rel="noopener noreferrer"><IconWhatsApp width={16} /> {t('resend')}</a>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty"><div className="empty__icon"><IconReceipt width={40} height={40} /></div>
                <h2>{t('ord_emptyTitle')}</h2><p>{t('ord_emptyText')}</p>
                <button className="btn-primary" onClick={() => setView('home')}>{t('makeOrder')}</button></div>
            )}
          </section>
        )}
      </main>

      {count > 0 && view !== 'cart' && view !== 'checkout' && (
        <button className="cart-bar" onClick={() => setView('cart')}>
          <span className="cart-bar__count">{count}</span>
          <span>{t('viewOrder')}</span>
          <b>{money(total)}</b>
        </button>
      )}

      <nav className="tabbar" aria-label="Menu">
        <button className={view === 'home' ? 'on' : ''} onClick={() => setView('home')} aria-label={t('nav_home')}><IconHome /></button>
        <button ref={cartBtn} className={view === 'cart' || view === 'checkout' ? 'on' : ''} onClick={() => setView('cart')} aria-label={t('nav_cart')}>
          <IconCart />{count > 0 && <i className="badge">{count}</i>}
        </button>
        <button className={view === 'orders' ? 'on' : ''} onClick={() => setView('orders')} aria-label={t('nav_orders')}><IconReceipt /></button>
        <button className={view === 'favs' ? 'on' : ''} onClick={() => setView('favs')} aria-label={t('nav_favs')}><IconStar /></button>
      </nav>

      {showIosHint && (
        <div className="ios-hint" onClick={() => { setShowIosHint(false); try { localStorage.setItem('hasbi.iosHint', '1'); } catch {} }}>
          {t('iosHint')} <span>✕</span>
        </div>
      )}

      {detail && (
        <ProductDetail product={detail} fav={favs.includes(detail.id)} onFav={toggleFav} onAdd={add}
          onClose={() => setDetail(null)} pairings={pairingsFor(detail)} onOpen={(p) => setDetail(byId[p.id] || p)} />
      )}
      {upsell && (
        <UpsellSheet suggestions={suggestions} cartQty={(id) => cart[id] || 0} added={upsellAdded}
          onAdd={upsellAdd} onContinue={goCheckout} onClose={() => setUpsell(false)} />
      )}
      {langOpen && (
        <div className="sheet-backdrop" onClick={() => setLangOpen(false)}>
          <div className="sheet" role="dialog" aria-label={t('language')} onClick={(e) => e.stopPropagation()}>
            <span className="sheet__grip" />
            <h2><IconGlobe width={20} /> {t('language')}</h2>
            <ul className="lang-list">
              {LANGS.map((l) => (
                <li key={l.code}>
                  <button className={l.code === lang ? 'on' : ''} onClick={() => { setLang(l.code); setLangOpen(false); }} lang={l.code} dir={l.rtl ? 'rtl' : 'ltr'}>
                    <span className="flag">{l.flag}</span>
                    <span className="lang-name">{l.label}{l.sub && <small>{l.sub}</small>}</span>
                    {l.code === lang && <IconCheck width={18} />}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {result && <TicketModal result={result} onClose={() => setResult(null)} />}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

// ---------- Hero con producto destacado rotativo ----------
function Hero({ items, onOpen }) {
  const { t, tp } = useI18n();
  const [i, setI] = useState(0);
  const ref = useMotion({ max: 5 });
  useEffect(() => {
    if (items.length < 2) return;
    const id = setInterval(() => setI((v) => (v + 1) % items.length), 4500);
    return () => clearInterval(id);
  }, [items.length]);
  const raw = items[i];
  if (!raw) return null;
  const p = tp(raw);
  const [whole, cents] = money(p.price).split(/(?=\.\d{3}$)/);
  return (
    <div ref={ref} className="hero motion" onClick={() => onOpen(raw)}>
      <div className="hero__img" key={p.id}><img src={imgUrl(p.images[0])} alt={p.name} /></div>
      <div className="hero__txt" key={`t${p.id}`}>
        <h2>{p.name}</h2>
        <p>{p.description}</p>
        <div className="hero__price"><small>{t('from')}</small><b dir="ltr">{whole}<sup>{cents}</sup></b></div>
      </div>
      <div className="hero__dots">{items.map((x, n) => <i key={x.id} className={n === i ? 'on' : ''} />)}</div>
    </div>
  );
}
