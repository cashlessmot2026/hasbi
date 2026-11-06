// Genera supabase/seed.sql a partir de src/data/menu.js
// Uso: npm run seed:sql
import { writeFileSync } from 'node:fs';
import { CATEGORIES, PRODUCTS } from '../src/data/menu.js';

const q = (s) => (s == null ? 'null' : `'${String(s).replace(/'/g, "''")}'`);
const arr = (a = []) => `array[${a.map(q).join(',')}]::text[]`;

let sql = '-- Generado por scripts/gen-seed.mjs — no editar a mano\n\n';
sql += 'insert into public.categories (id, name, emoji, sort) values\n';
sql += CATEGORIES.map((c) => `  (${q(c.id)}, ${q(c.name)}, ${q(c.emoji)}, ${c.sort})`).join(',\n');
sql += '\non conflict (id) do update set name = excluded.name, emoji = excluded.emoji, sort = excluded.sort;\n\n';

sql += 'insert into public.products (id, name, description, price, categories, images, tags, featured, upsell, sort) values\n';
sql += PRODUCTS.map((p) =>
  `  (${q(p.id)}, ${q(p.name)}, ${q(p.description)}, ${p.price}, ${arr(p.categories)}, ${arr(p.images)}, ${arr(p.tags)}, ${!!p.featured}, ${!!p.upsell}, ${p.sort ?? 0})`
).join(',\n');
sql += '\non conflict (id) do update set name = excluded.name, description = excluded.description, price = excluded.price,\n' +
  '  categories = excluded.categories, images = excluded.images, tags = excluded.tags, featured = excluded.featured,\n' +
  '  upsell = excluded.upsell, sort = excluded.sort;\n';

writeFileSync(new URL('../supabase/seed.sql', import.meta.url), sql);
console.log(`seed.sql: ${CATEGORIES.length} categorías, ${PRODUCTS.length} productos`);
