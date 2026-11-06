// La clave "publishable" de Supabase es pública por diseño: la seguridad la dan las políticas RLS.
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://hvgneumxreiczklkwtyw.supabase.co';
export const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || 'sb_publishable_VQzJ5cypp9vdfK-JlHo9UA_FilQynrP';

export const BUSINESS = {
  name: 'Hasbi',
  tagline: 'Cocina rápida libanesa',
  whatsapp: '573232252945', // +57 323 2252945
  whatsappLabel: '+57 323 225 2945',
};
