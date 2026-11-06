-- Generado por scripts/gen-seed.mjs — no editar a mano

insert into public.categories (id, name, emoji, sort) values
  ('shawarma', 'Sándwich Shawarma', '🌯', 1),
  ('bowls', 'Bowls', '🥙', 2),
  ('bandejas', 'Bandejas y platos', '🍽️', 3),
  ('entradas', 'Entradas y acompañantes', '🧆', 4),
  ('horneados', 'Horneados', '🥟', 5),
  ('vegetarianas', 'Opciones vegetarianas', '🥗', 6),
  ('adiciones', 'Adiciones', '➕', 7)
on conflict (id) do update set name = excluded.name, emoji = excluded.emoji, sort = excluded.sort;

insert into public.products (id, name, description, price, categories, images, tags, featured, upsell, sort) values
  ('shawarma-pollo', 'Shawarma de pollo', 'Pan árabe, pollo, tomate, lechuga, cebolla, pepinillos y salsa de ajo.', 33000, array['shawarma']::text[], array['shawarma-pollo.webp']::text[], array[]::text[], true, false, 1),
  ('shawarma-mixto', 'Shawarma mixto', 'Pan árabe, pollo, carne, lechuga, tomate, pepinillos, cebolla y salsa de ajo.', 34000, array['shawarma']::text[], array['shawarma-mixto.webp']::text[], array[]::text[], true, false, 2),
  ('shawarma-cheddar', 'Shawarma de queso cheddar', 'Pan árabe, pollo, carne, queso cheddar y papas fritas (por dentro).', 40000, array['shawarma']::text[], array['shawarma-cheddar.webp']::text[], array[]::text[], true, false, 3),
  ('sandwich-falafel', 'Sándwich falafel (vegano)', 'Lechuga, tomate, cebolla y pepinillos con croquetas de garbanzo (falafel) y salsa tahine.', 27000, array['shawarma','vegetarianas']::text[], array['sandwich-falafel.webp']::text[], array['vegano']::text[], false, false, 4),
  ('bowl-mixto', 'Bowl mixto', 'Base de lechuga, tomate, pepinillos, cebolla, cortes mixtos (carne y pollo), perejil y salsa de ajo.', 42500, array['bowls']::text[], array['bowl-mixto.webp']::text[], array[]::text[], true, false, 1),
  ('bowl-papas', 'Bowl papas', 'Base de lechuga, tomate, cebolla, pepinillos y cortes mixtos (carne de res y pechuga de pollo), salsa de ajo y perejil.', 49000, array['bowls']::text[], array['bowl-papas.webp']::text[], array[]::text[], false, false, 2),
  ('bowl-queso-cheddar', 'Bowl queso cheddar', 'Base de papas fritas, lechuga, tomate, cebolla y pepinillos, papas francesas, con cortes finos de shawarma y queso cheddar fundido.', 55000, array['bowls']::text[], array['bowl-queso-cheddar.webp']::text[], array[]::text[], true, false, 3),
  ('bandeja-x4', 'Bandeja x4', 'Incluye bebida 1.5L, 4 kibbeh, 4 falafel, 4 medios shawarma, papitas francesas, pan y salsas.', 195000, array['bandejas']::text[], array['bandeja-x4.webp']::text[], array['para compartir']::text[], true, false, 1),
  ('plato-mixto-especial', 'Plato mixto especial', '1/2 shawarma, 2 kibbeh, tabbouleh, 2 falafel, 2 pan mini árabe y hummus (crema de garbanzo).', 58000, array['bandejas']::text[], array['plato-mixto-especial.webp']::text[], array[]::text[], true, false, 2),
  ('hummus', 'Hummus', 'Tahini con garbanzos y pan mini.', 25000, array['bandejas','vegetarianas']::text[], array['hummus.webp']::text[], array['vegetariano']::text[], false, false, 3),
  ('tabbuleh', 'Tabbuleh', 'Ensalada a base de perejil, tomate, cebolla y trigo.', 22000, array['bandejas','vegetarianas']::text[], array['tabbuleh.webp']::text[], array['vegetariano']::text[], false, false, 4),
  ('combo-falafel-x3', 'Combo falafel x3', '3 falafel (croqueta de garbanzos), pan árabe y hummus.', 15000, array['entradas']::text[], array['combo-falafel-x3.webp']::text[], array[]::text[], false, true, 1),
  ('combo-kibbeh-x3', 'Combo kibbeh x3', '3 kibbehs, 3 pan árabe y crema de hummus.', 22000, array['entradas']::text[], array['combo-kibbeh-x3.webp']::text[], array[]::text[], false, false, 2),
  ('kibbeh-yuca-queso', 'Kibbeh yuca y queso (vegetariano)', 'Croqueta crocante de yuca rellena de queso derretido.', 7000, array['entradas','vegetarianas']::text[], array['kibbeh-yuca-queso.webp','kibbeh-yuca-queso-2.webp']::text[], array['vegetariano']::text[], false, true, 3),
  ('kibbeh-unidad', 'Kibbeh unidad', 'Kibbeh tradicional libanés, por unidad.', 8000, array['entradas']::text[], array['kibbeh-unidad.webp']::text[], array[]::text[], false, true, 4),
  ('papa-francesas', 'Papas francesas', 'Porción de papas a la francesa.', 9000, array['entradas']::text[], array['papa-francesas.webp']::text[], array[]::text[], false, true, 5),
  ('fatayer-pollo', 'Fatayer de pollo', 'Horneado relleno de pollo.', 12000, array['horneados']::text[], array['fatayer-pollo.webp']::text[], array[]::text[], false, true, 1),
  ('fatayer-espinaca-queso', 'Fatayer de espinaca y queso', 'Horneado relleno de espinaca y queso.', 12000, array['horneados','vegetarianas']::text[], array['fatayer-espinaca-queso.webp']::text[], array['vegetariano']::text[], false, false, 2),
  ('falafel-bowl', 'Falafel bowl', '6 croquetas de garbanzos, habas y yerbas frescas en una cama de verduras con salsa tahine.', 30000, array['vegetarianas']::text[], array['falafel-bowl.webp']::text[], array['vegetariano']::text[], false, false, 3),
  ('hummus-personal', 'Hummus personal', 'Hummus en porción personal (2.5 oz).', 5000, array['adiciones']::text[], array['hummus-personal.webp']::text[], array[]::text[], false, true, 1),
  ('pan-mini', 'Pan mini x4 unidades', 'Pan árabe mini, 4 unidades.', 5000, array['adiciones']::text[], array['pan-mini.webp']::text[], array[]::text[], false, true, 2)
on conflict (id) do update set name = excluded.name, description = excluded.description, price = excluded.price,
  categories = excluded.categories, images = excluded.images, tags = excluded.tags, featured = excluded.featured,
  upsell = excluded.upsell, sort = excluded.sort;
