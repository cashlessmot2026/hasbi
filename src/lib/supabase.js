import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_KEY } from '../config.js';
import { CATEGORIES, PRODUCTS } from '../data/menu.js';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

const withTimeout = (p, ms) =>
  Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);

/** Carga el menú desde Supabase; si falla o está vacío usa los datos locales. */
export async function loadMenu() {
  try {
    const [cats, prods] = await withTimeout(
      Promise.all([
        supabase.from('categories').select('*').order('sort'),
        supabase.from('products').select('*').order('sort'),
      ]),
      6000
    );
    if (cats.error) throw cats.error;
    if (prods.error) throw prods.error;
    if (!cats.data?.length || !prods.data?.length) throw new Error('menú vacío');
    const [settings, banners, locations] = await withTimeout(Promise.all([
      supabase.from('settings').select('*').eq('id', 1).maybeSingle(),
      supabase.from('banners').select('*').order('sort'),
      supabase.from('locations').select('*').order('sort'),
    ]), 6000).catch(() => [{}, {}, {}]);
    return {
      categories: cats.data, products: prods.data, source: 'supabase',
      settings: settings?.data || null, banners: banners?.data || [], locations: locations?.data || [],
    };
  } catch (err) {
    console.warn('[Hasbi] Usando menú local:', err?.message || err);
    return { categories: CATEGORIES, products: PRODUCTS, source: 'local', settings: null, banners: [], locations: [] };
  }
}

/** Sube el ticket (PNG) al bucket público "tickets" y devuelve su URL pública. */
export async function uploadTicket(blob, code) {
  const path = `${new Date().toISOString().slice(0, 10)}/${code}.png`;
  const { error } = await withTimeout(
    supabase.storage.from('tickets').upload(path, blob, { contentType: 'image/png', upsert: false }),
    8000
  );
  if (error) throw error;
  return supabase.storage.from('tickets').getPublicUrl(path).data.publicUrl;
}

export async function saveOrder(order) {
  const { error } = await withTimeout(supabase.from('orders').insert(order), 8000);
  if (error) throw error;
}
