import { supabase } from '../lib/supabase.js';

const KEY = 'hasbi.admin.pass';
export const getPass = () => { try { return sessionStorage.getItem(KEY) || ''; } catch { return ''; } };
export const setPass = (p) => { try { p ? sessionStorage.setItem(KEY, p) : sessionStorage.removeItem(KEY); } catch {} };

async function rpc(fn, args) {
  const { data, error } = await supabase.rpc(fn, { pass: getPass(), ...args });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data;
}

export const login = async (pass) => {
  const { data, error } = await supabase.rpc('admin_login', { pass });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  setPass(pass);
};
export const loadAll = () => rpc('admin_data');
export const save = (entity, rec) => rpc('admin_save', { entity, rec });
export const remove = (entity, id) => rpc('admin_delete', { entity, rec_id: String(id) });
export const changePassword = (new_pass) => rpc('admin_change_password', { new_pass });

/** Redimensiona (máx. 1400 px) y convierte a WebP antes de subir al bucket público "menu". */
export async function uploadImage(file, folder = 'products') {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1400 / Math.max(bmp.width, bmp.height));
  const cv = document.createElement('canvas');
  cv.width = Math.round(bmp.width * scale); cv.height = Math.round(bmp.height * scale);
  cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height);
  const blob = await new Promise((r) => cv.toBlob(r, 'image/webp', 0.85));
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
  const { error } = await supabase.storage.from('menu').upload(path, blob, { contentType: 'image/webp' });
  if (error) throw new Error(error.message);
  return supabase.storage.from('menu').getPublicUrl(path).data.publicUrl;
}

export const slugify = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);

/** Geocodifica una dirección con OpenStreetMap (Nominatim). */
export async function geocode(q) {
  const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=es&q=${encodeURIComponent(q)}`);
  const [hit] = await r.json();
  if (!hit) throw new Error('No se encontró la dirección');
  return { lat: Number(hit.lat), lng: Number(hit.lon), label: hit.display_name };
}
