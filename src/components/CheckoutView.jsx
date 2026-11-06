import { useState } from 'react';
import { money } from '../lib/format.js';
import { useI18n } from '../i18n/index.jsx';
import { IconBack, IconPin, IconWhatsApp } from './Icons.jsx';

const TYPES = ['domicilio', 'recoger', 'mesa'];
export const PAYMENTS = [
  { id: 'efectivo', icon: '💵' },
  { id: 'nequi', icon: '📱' },
  { id: 'daviplata', icon: '📲' },
  { id: 'transferencia', icon: '🏦' },
  { id: 'tarjeta', icon: '💳' },
];

/** Pide la ubicación GPS del celular (el navegador muestra el aviso para activarla). */
const UA = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
const IS_IOS = /iPad|iPhone|iPod/.test(UA) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
// Navegadores integrados (WhatsApp, Instagram, Facebook, TikTok…) bloquean la ubicación aunque el celular la permita.
const IN_APP = /FBAN|FBAV|FB_IAB|Instagram|WhatsApp|TikTok|musical_ly|Line\/|Snapchat|Twitter|; wv\)/i.test(UA)
  || (IS_IOS && !/Safari\//.test(UA) && !navigator.standalone);

const getPos = (opts) => new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, opts));

export async function requestLocation() {
  if (!('geolocation' in navigator)) throw Object.assign(new Error('unsupported'), { code: 'unsupported' });
  let pos;
  try {
    // 1) Precisión alta (GPS). 2) Si tarda o falla por señal, red/wifi. iOS a veces responde mejor al segundo intento.
    pos = await getPos({ enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 });
  } catch (e1) {
    if (e1.code === 1 && !IS_IOS) throw e1;
    try {
      pos = await getPos({ enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 });
    } catch (e2) {
      throw e1.code === 1 ? e1 : e2;
    }
  }
  return { lat: pos.coords.latitude, lng: pos.coords.longitude, acc: Math.round(pos.coords.accuracy) };
}

/** Paso 3: datos de entrega, GPS y método de pago. */
export default function CheckoutView({ total, count, customer, setCustomer, location, setLocation, onBack, onSubmit, busy }) {
  const { t } = useI18n();
  const [errors, setErrors] = useState({});
  const [gps, setGps] = useState(location ? 'ok' : 'idle'); // idle | loading | ok | denied | unavailable | unsupported
  const ERR_KEY = { name: 'name', phone: 'phone', address: 'address', cashWith: 'cash' };
  const set = (k) => (e) => {
    setCustomer({ ...customer, [k]: e.target.value });
    if (errors[ERR_KEY[k]]) setErrors((er) => ({ ...er, [ERR_KEY[k]]: undefined }));
  };
  const delivery = customer.type === 'domicilio';
  const cashNum = Number(String(customer.cashWith || '').replace(/\D/g, '')) || 0;

  const locate = async () => {
    setGps('loading');
    try {
      const loc = await requestLocation();
      setLocation(loc); setGps('ok');
      setErrors((e) => ({ ...e, gps: undefined }));
      return loc;
    } catch (err) {
      setLocation(null);
      setGps(err.code === 1 ? 'denied' : err.code === 'unsupported' ? 'unsupported' : 'unavailable');
      return null;
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    const err = {};
    if (!customer.name.trim()) err.name = t('err_name');
    if (String(customer.phone).replace(/\D/g, '').length < 7) err.phone = t('err_phone');
    if (delivery && !customer.address.trim()) err.address = t('err_address');
    if (customer.type === 'mesa' && !customer.address.trim()) err.address = t('err_table');
    if (!customer.payment) err.payment = t('err_payment');
    if (customer.payment === 'efectivo' && cashNum && cashNum < total) err.cash = t('err_cash');

    const loc = location; // El GPS es opcional: si falta, se pide el pin por WhatsApp.

    setErrors(err);
    if (Object.keys(err).length) {
      setTimeout(() => document.querySelector('.has-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
      return;
    }
    onSubmit(loc);
  };

  return (
    <form className="cart" onSubmit={submit} noValidate>
      <div className="page-head">
        <button type="button" className="icon-btn" onClick={onBack} aria-label={t('back')}><IconBack className="flip-rtl" /></button>
        <h1 className="page-title">{t('checkout')}</h1>
      </div>

      <h2 className="section-title sm">{t('yourData')}</h2>
      <div className="seg">
        {TYPES.map((id) => (
          <button type="button" key={id} className={customer.type === id ? 'on' : ''} onClick={() => setCustomer({ ...customer, type: id })}>
            {t(`type_${id}`)}
          </button>
        ))}
      </div>

      <label className={`field ${errors.name ? 'has-error' : ''}`}>
        <span>{t('recipient')}</span>
        <input value={customer.name} onChange={set('name')} placeholder={t('recipientPh')} autoComplete="name" />
        {errors.name && <em>{errors.name}</em>}
      </label>

      <label className={`field ${errors.phone ? 'has-error' : ''}`}>
        <span>{t('phone')}</span>
        <input value={customer.phone} onChange={set('phone')} placeholder={t('phonePh')} inputMode="tel" type="tel" autoComplete="tel" dir="ltr" />
        {errors.phone && <em>{errors.phone}</em>}
      </label>

      {customer.type !== 'recoger' && (
        <label className={`field ${errors.address ? 'has-error' : ''}`}>
          <span>{delivery ? t('address') : t('table')}</span>
          <input value={customer.address} onChange={set('address')} placeholder={delivery ? t('addressPh') : t('tablePh')} autoComplete={delivery ? 'street-address' : 'off'} />
          {errors.address && <em>{errors.address}</em>}
        </label>
      )}

      {delivery && (
        <div className={`field gps ${errors.gps ? 'has-error' : ''}`}>
          <span>{t('gps')}</span>
          <div className={`gps__box gps--${gps}`}>
            <IconPin width={22} height={22} />
            <div className="gps__txt">
              {gps === 'ok' && location ? (
                <>
                  <b>{t('gpsOk', { acc: location.acc })}</b>
                  <a href={`https://maps.google.com/?q=${location.lat},${location.lng}`} target="_blank" rel="noopener noreferrer" dir="ltr">
                    {location.lat.toFixed(5)}, {location.lng.toFixed(5)} · {t('viewMap')}
                  </a>
                </>
              ) : gps === 'loading' ? <b>{t('gpsLoading')}</b>
                : gps === 'denied' ? <b className="warn">{t('gpsDenied')}</b>
                : gps === 'unavailable' ? <b className="warn">{t('gpsUnavailable')}</b>
                : gps === 'unsupported' ? <b className="warn">{t('gpsUnsupported')}</b>
                : <small>{t('gpsHelp')}</small>}
            </div>
            <button type="button" className={gps === 'ok' ? 'btn-soft sm' : 'btn-primary sm'} onClick={locate} disabled={gps === 'loading'}>
              {gps === 'loading' ? <span className="spinner" /> : gps === 'ok' ? t('gpsUpdate') : t('gpsBtn')}
            </button>
          </div>
          {gps === 'ok' ? null : (
            <div className="gps__help">
              {IN_APP && <p>{t('gpsInApp')}</p>}
              {(gps === 'denied' || gps === 'unavailable') && <p>{t(IS_IOS ? 'gpsStepsIos' : 'gpsStepsAndroid')}</p>}
              {IN_APP && (
                <button type="button" className="btn-soft sm" onClick={() => {
                  const url = window.location.origin + import.meta.env.BASE_URL;
                  (navigator.clipboard?.writeText(url) || Promise.reject()).then(() => alert(t('linkCopied')), () => window.prompt(t('copyLink'), url));
                }}>{t('copyLink')}</button>
              )}
              <small>{t('gpsOptional')}</small>
            </div>
          )}
        </div>
      )}

      <div className={`field ${errors.payment ? 'has-error' : ''}`}>
        <span>{t('payment')}</span>
        <div className="pay-grid">
          {PAYMENTS.map((m) => (
            <button type="button" key={m.id} className={`pay ${customer.payment === m.id ? 'on' : ''}`}
              onClick={() => { setCustomer({ ...customer, payment: m.id }); setErrors((e) => ({ ...e, payment: undefined })); }}>
              <i>{m.icon}</i>{t(`pay_${m.id}`)}
            </button>
          ))}
        </div>
        {errors.payment && <em>{errors.payment}</em>}
      </div>

      {customer.payment === 'efectivo' && (
        <label className={`field ${errors.cash ? 'has-error' : ''}`}>
          <span>{t('cashWith')}</span>
          <input value={customer.cashWith || ''} onChange={set('cashWith')} placeholder={t('cashPh')} inputMode="numeric" dir="ltr" />
          {cashNum >= total && cashNum > 0 && <small className="hint">{t('change', { n: money(cashNum - total) })}</small>}
          {errors.cash && <em>{errors.cash}</em>}
        </label>
      )}

      <label className="field">
        <span>{t('notes')}</span>
        <textarea value={customer.notes} onChange={set('notes')} rows={2} placeholder={t('notesPh')} />
      </label>

      <div className="cart__total">
        <div>
          <span className="muted">{t('total')} · {t('items', { n: count })}</span>
          <strong>{money(total)}</strong>
        </div>
        <button type="submit" className="btn-primary lg" disabled={busy}>
          {busy ? <span className="spinner" /> : <IconWhatsApp width={20} />}
          {busy ? t('generating') : t('finish')}
        </button>
      </div>
    </form>
  );
}
