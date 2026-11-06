import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { UI } from './ui.js';
import { MENU_I18N } from './menu.js';

export const LANGS = [
  { code: 'es', label: 'Español', flag: '🇨🇴' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt-BR', label: 'Português (Brasil)', flag: '🇧🇷' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'ar-LB', label: 'لبناني', sub: 'Libanés', flag: '🇱🇧', rtl: true },
  { code: 'ar', label: 'العربية', sub: 'Árabe', flag: '🇸🇦', rtl: true },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'uk', label: 'Українська', flag: '🇺🇦' },
];

function detect() {
  try { const s = localStorage.getItem('hasbi.lang'); if (s && UI[s]) return s; } catch {}
  for (const l of navigator.languages || [navigator.language]) {
    if (!l) continue;
    if (UI[l]) return l;
    const base = l.split('-')[0];
    if (base === 'pt') return 'pt-BR';
    if (l === 'ar-LB') return 'ar-LB';
    if (UI[base]) return base;
  }
  return 'es';
}

const Ctx = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(detect);
  const meta = LANGS.find((l) => l.code === lang) || LANGS[0];

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = meta.rtl ? 'rtl' : 'ltr';
    try { localStorage.setItem('hasbi.lang', lang); } catch {}
  }, [lang, meta.rtl]);

  const t = useCallback((key, vars) => {
    let s = UI[lang]?.[key] ?? UI.en?.[key] ?? UI.es[key] ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v);
    return s;
  }, [lang]);

  // Producto traducido: primero la columna i18n de Supabase, luego el archivo local, luego español.
  const tp = useCallback((p) => {
    if (!p || lang === 'es') return p;
    const db = p.i18n?.[lang];
    const loc = MENU_I18N[lang]?.p?.[p.id];
    return { ...p, name: db?.name || loc?.[0] || p.name, description: db?.description || loc?.[1] || p.description };
  }, [lang]);

  const tc = useCallback((c) => {
    if (!c || lang === 'es') return c?.name;
    return c.i18n?.[lang] || MENU_I18N[lang]?.cats?.[c.id] || c.name;
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t, tp, tc, rtl: !!meta.rtl, meta }), [lang, t, tp, tc, meta]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useI18n = () => useContext(Ctx);
