import { useState } from 'react';
import { money, imgUrl } from '../lib/format.js';
import { IconPlus, IconMinus, IconTrash, IconCart } from './Icons.jsx';

const TYPES = [
  { id: 'domicilio', label: '🛵 Domicilio' },
  { id: 'recoger', label: '🏃 Recoger' },
  { id: 'mesa', label: '🍽️ En mesa' },
];

export default function CartView({ lines, total, setQty, remove, customer, setCustomer, onCheckout, onBrowse }) {
  const [errors, setErrors] = useState({});
  const set = (k) => (e) => setCustomer({ ...customer, [k]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    const err = {};
    if (!customer.name.trim()) err.name = 'Escribe tu nombre';
    if (customer.type === 'domicilio' && !customer.address.trim()) err.address = 'Necesitamos la dirección';
    if (customer.type === 'mesa' && !customer.address.trim()) err.address = 'Indica el número de mesa';
    setErrors(err);
    if (Object.keys(err).length) {
      document.querySelector('.field.has-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    onCheckout();
  };

  if (!lines.length) {
    return (
      <div className="empty">
        <div className="empty__icon"><IconCart width={40} height={40} /></div>
        <h2>Tu pedido está vacío</h2>
        <p>Explora el menú y agrega tus favoritos libaneses.</p>
        <button className="btn-primary" onClick={onBrowse}>Ver el menú</button>
      </div>
    );
  }

  return (
    <form className="cart" onSubmit={submit} noValidate>
      <h1 className="page-title">Tu pedido</h1>
      <ul className="cart__list">
        {lines.map(({ product: p, qty }) => (
          <li key={p.id} className="cart-line">
            <img src={imgUrl(p.images[0])} alt="" />
            <div className="cart-line__info">
              <h3>{p.name}</h3>
              <span className="muted">{money(p.price)} c/u</span>
              <b className="price">{money(p.price * qty)}</b>
            </div>
            <div className="cart-line__ctrl">
              <button type="button" className="icon-btn sm ghost" onClick={() => remove(p.id)} aria-label="Quitar"><IconTrash width={16} /></button>
              <div className="stepper sm">
                <button type="button" onClick={() => setQty(p.id, qty - 1)} aria-label="Menos"><IconMinus width={14} /></button>
                <span>{qty}</span>
                <button type="button" onClick={() => setQty(p.id, qty + 1)} aria-label="Más"><IconPlus width={14} /></button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <h2 className="section-title">Tus datos</h2>
      <div className="seg">
        {TYPES.map((t) => (
          <button type="button" key={t.id} className={customer.type === t.id ? 'on' : ''} onClick={() => setCustomer({ ...customer, type: t.id })}>
            {t.label}
          </button>
        ))}
      </div>
      <label className={`field ${errors.name ? 'has-error' : ''}`}>
        <span>Nombre *</span>
        <input value={customer.name} onChange={set('name')} placeholder="¿A nombre de quién?" autoComplete="name" />
        {errors.name && <em>{errors.name}</em>}
      </label>
      <label className="field">
        <span>Teléfono</span>
        <input value={customer.phone} onChange={set('phone')} placeholder="300 000 0000" inputMode="tel" autoComplete="tel" />
      </label>
      {customer.type !== 'recoger' && (
        <label className={`field ${errors.address ? 'has-error' : ''}`}>
          <span>{customer.type === 'mesa' ? 'Número de mesa *' : 'Dirección de entrega *'}</span>
          <input value={customer.address} onChange={set('address')} placeholder={customer.type === 'mesa' ? 'Mesa 4' : 'Calle, número, barrio, apto'} autoComplete={customer.type === 'mesa' ? 'off' : 'street-address'} />
          {errors.address && <em>{errors.address}</em>}
        </label>
      )}
      <label className="field">
        <span>Notas para la cocina</span>
        <textarea value={customer.notes} onChange={set('notes')} rows={2} placeholder="Sin cebolla, salsa aparte…" />
      </label>

      <div className="cart__total">
        <div>
          <span className="muted">Total ({lines.reduce((n, l) => n + l.qty, 0)} productos)</span>
          <strong>{money(total)}</strong>
        </div>
        <button type="submit" className="btn-primary lg">Terminar pedido</button>
      </div>
    </form>
  );
}
