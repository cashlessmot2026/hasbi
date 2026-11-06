// Datos del menú extraídos de las fotos de cada carpeta.
// Se usan como respaldo offline y como semilla para Supabase (supabase/schema.sql).

export const CATEGORIES = [
  { id: 'shawarma', name: 'Sándwich Shawarma', emoji: '🌯', sort: 1 },
  { id: 'bowls', name: 'Bowls', emoji: '🥙', sort: 2 },
  { id: 'bandejas', name: 'Bandejas y platos', emoji: '🍽️', sort: 3 },
  { id: 'entradas', name: 'Entradas y acompañantes', emoji: '🧆', sort: 4 },
  { id: 'horneados', name: 'Horneados', emoji: '🥟', sort: 5 },
  { id: 'vegetarianas', name: 'Opciones vegetarianas', emoji: '🥗', sort: 6 },
  { id: 'adiciones', name: 'Adiciones', emoji: '➕', sort: 7 },
];

export const PRODUCTS = [
  // SANDWICH SHAWARMA
  { id: 'shawarma-pollo', name: 'Shawarma de pollo', price: 33000, categories: ['shawarma'], featured: true, sort: 1,
    description: 'Pan árabe, pollo, tomate, lechuga, cebolla, pepinillos y salsa de ajo.', images: ['shawarma-pollo.webp'] },
  { id: 'shawarma-mixto', name: 'Shawarma mixto', price: 34000, categories: ['shawarma'], featured: true, sort: 2,
    description: 'Pan árabe, pollo, carne, lechuga, tomate, pepinillos, cebolla y salsa de ajo.', images: ['shawarma-mixto.webp'] },
  { id: 'shawarma-cheddar', name: 'Shawarma de queso cheddar', price: 40000, categories: ['shawarma'], featured: true, sort: 3,
    description: 'Pan árabe, pollo, carne, queso cheddar y papas fritas (por dentro).', images: ['shawarma-cheddar.webp'] },
  { id: 'sandwich-falafel', name: 'Sándwich falafel (vegano)', price: 27000, categories: ['shawarma', 'vegetarianas'], sort: 4, tags: ['vegano'],
    description: 'Lechuga, tomate, cebolla y pepinillos con croquetas de garbanzo (falafel) y salsa tahine.', images: ['sandwich-falafel.webp'] },

  // BOWLS
  { id: 'bowl-mixto', name: 'Bowl mixto', price: 42500, categories: ['bowls'], featured: true, sort: 1,
    description: 'Base de lechuga, tomate, pepinillos, cebolla, cortes mixtos (carne y pollo), perejil y salsa de ajo.', images: ['bowl-mixto.webp'] },
  { id: 'bowl-papas', name: 'Bowl papas', price: 49000, categories: ['bowls'], sort: 2,
    description: 'Base de lechuga, tomate, cebolla, pepinillos y cortes mixtos (carne de res y pechuga de pollo), salsa de ajo y perejil.', images: ['bowl-papas.webp'] },
  { id: 'bowl-queso-cheddar', name: 'Bowl queso cheddar', price: 55000, categories: ['bowls'], featured: true, sort: 3,
    description: 'Base de papas fritas, lechuga, tomate, cebolla y pepinillos, papas francesas, con cortes finos de shawarma y queso cheddar fundido.', images: ['bowl-queso-cheddar.webp'] },

  // BANDEJAS Y PLATOS
  { id: 'bandeja-x4', name: 'Bandeja x4', price: 195000, categories: ['bandejas'], featured: true, sort: 1, tags: ['para compartir'],
    description: 'Incluye bebida 1.5L, 4 kibbeh, 4 falafel, 4 medios shawarma, papitas francesas, pan y salsas.', images: ['bandeja-x4.webp'] },
  { id: 'plato-mixto-especial', name: 'Plato mixto especial', price: 58000, categories: ['bandejas'], featured: true, sort: 2,
    description: '1/2 shawarma, 2 kibbeh, tabbouleh, 2 falafel, 2 pan mini árabe y hummus (crema de garbanzo).', images: ['plato-mixto-especial.webp'] },
  { id: 'hummus', name: 'Hummus', price: 25000, categories: ['bandejas', 'vegetarianas'], sort: 3, tags: ['vegetariano'],
    description: 'Tahini con garbanzos y pan mini.', images: ['hummus.webp'] },
  { id: 'tabbuleh', name: 'Tabbuleh', price: 22000, categories: ['bandejas', 'vegetarianas'], sort: 4, tags: ['vegetariano'],
    description: 'Ensalada a base de perejil, tomate, cebolla y trigo.', images: ['tabbuleh.webp'] },

  // ENTRADAS Y ACOMPAÑANTES
  { id: 'combo-falafel-x3', name: 'Combo falafel x3', price: 15000, categories: ['entradas'], sort: 1, upsell: true,
    description: '3 falafel (croqueta de garbanzos), pan árabe y hummus.', images: ['combo-falafel-x3.webp'] },
  { id: 'combo-kibbeh-x3', name: 'Combo kibbeh x3', price: 22000, categories: ['entradas'], sort: 2,
    description: '3 kibbehs, 3 pan árabe y crema de hummus.', images: ['combo-kibbeh-x3.webp'] },
  { id: 'kibbeh-yuca-queso', name: 'Kibbeh yuca y queso (vegetariano)', price: 7000, categories: ['entradas', 'vegetarianas'], sort: 3, upsell: true, tags: ['vegetariano'],
    description: 'Croqueta crocante de yuca rellena de queso derretido.', images: ['kibbeh-yuca-queso.webp', 'kibbeh-yuca-queso-2.webp'] },
  { id: 'kibbeh-unidad', name: 'Kibbeh unidad', price: 8000, categories: ['entradas'], sort: 4, upsell: true,
    description: 'Kibbeh tradicional libanés, por unidad.', images: ['kibbeh-unidad.webp'] },
  { id: 'papa-francesas', name: 'Papas francesas', price: 9000, categories: ['entradas'], sort: 5, upsell: true,
    description: 'Porción de papas a la francesa.', images: ['papa-francesas.webp'] },

  // HORNEADOS
  { id: 'fatayer-pollo', name: 'Fatayer de pollo', price: 12000, categories: ['horneados'], sort: 1, upsell: true,
    description: 'Horneado relleno de pollo.', images: ['fatayer-pollo.webp'] },
  { id: 'fatayer-espinaca-queso', name: 'Fatayer de espinaca y queso', price: 12000, categories: ['horneados', 'vegetarianas'], sort: 2, tags: ['vegetariano'],
    description: 'Horneado relleno de espinaca y queso.', images: ['fatayer-espinaca-queso.webp'] },

  // OPCIONES VEGETARIANAS
  { id: 'falafel-bowl', name: 'Falafel bowl', price: 30000, categories: ['vegetarianas'], sort: 3, tags: ['vegetariano'],
    description: '6 croquetas de garbanzos, habas y yerbas frescas en una cama de verduras con salsa tahine.', images: ['falafel-bowl.webp'] },

  // ADICIONES
  { id: 'hummus-personal', name: 'Hummus personal', price: 5000, categories: ['adiciones'], sort: 1, upsell: true,
    description: 'Hummus en porción personal (2.5 oz).', images: ['hummus-personal.webp'] },
  { id: 'pan-mini', name: 'Pan mini x4 unidades', price: 5000, categories: ['adiciones'], sort: 2, upsell: true,
    description: 'Pan árabe mini, 4 unidades.', images: ['pan-mini.webp'] },
];
