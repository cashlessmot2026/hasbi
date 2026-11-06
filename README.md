# Hasbi · Menú digital (PWA)

Menú digital instalable de **Hasbi – Cocina rápida libanesa**. El cliente arma su pedido, la app le sugiere acompañantes antes de terminar, genera un **ticket en imagen** y abre **WhatsApp (+57 323 225 2945)** con el pedido precargado.

**En vivo:** https://cashlessmot2026.github.io/hasbi/

## Stack
- React 18 + Vite 5
- PWA (`vite-plugin-pwa`): instalable, funciona offline (menú y fotos en caché)
- Supabase: tablas `categories`, `products`, `orders` + bucket público `tickets`
- Despliegue automático a GitHub Pages (`.github/workflows/deploy.yml`)

## Funciones
- Categorías, buscador, productos destacados, favoritos y historial de pedidos
- Tarjetas con inclinación 3D al pasar el cursor y parallax/aparición al hacer scroll en el celular
- Imágenes ampliables a pantalla completa con zoom y galería
- Flujo de pedido: carrito → sugerencias (“¿Le sumamos algo más?”, con opción **No, gracias**) → datos de entrega → WhatsApp
- Datos de entrega: nombre de quien recibe, teléfono, dirección, **ubicación GPS** (el celular pide activar el GPS), método de pago (efectivo con cálculo de vuelto, Nequi, Daviplata, transferencia, tarjeta) y notas
- **9 idiomas** con traducción completa del menú e interfaz: español, inglés, alemán, portugués (Brasil), italiano, libanés, árabe (ambos de derecha a izquierda), ruso y ucraniano. El pedido y el ticket llegan al restaurante siempre en español, indicando el idioma del cliente
- Ticket PNG dibujado en canvas, subido a Supabase Storage; su enlace va en el mensaje de WhatsApp
- El pedido se guarda en la tabla `orders`

## Panel de administración (oculto)
- URL: **https://cashlessmot2026.github.io/hasbi/admin** (no hay ningún enlace a ella en el menú)
- Clave inicial: `1234` — **cámbiala** en la sección *Clave* del panel.
- Permite: crear/editar/ocultar/eliminar productos (varias imágenes, descripción, precio, categorías, etiquetas, destacado, sugerido, traducciones), categorías, banners de portada, ubicaciones/sedes (GPS, búsqueda por dirección y mapa), datos del negocio (WhatsApp que recibe pedidos, teléfono, horario) y ver los últimos pedidos.
- Seguridad: la clave se valida en Supabase (funciones `admin_*`, hash bcrypt en `private.admin_auth`); tras 5 intentos fallidos se bloquea 15 minutos. Sin clave, el público solo puede leer el menú y crear pedidos.
- SQL: `supabase/admin.sql` (ejecutar después de `schema.sql`).

## Desarrollo
```bash
npm install
npm run dev          # http://localhost:5173/hasbi/
npm run build
```

## Base de datos
1. Supabase → SQL Editor → ejecutar `supabase/schema.sql` y luego `supabase/seed.sql`.
2. Para cambiar precios o productos: edita la tabla `products` en Supabase (la app la lee en vivo).
   Las traducciones de cada producto están en la columna `i18n` (JSON por idioma); textos de la interfaz en `src/i18n/ui.js`.
   Si editas `src/data/menu.js` o `src/i18n/menu.js` (respaldo offline), regenera la semilla con `npm run seed:sql`.

Los pedidos se consultan en Supabase → Table editor → `orders` (los clientes solo pueden crear pedidos, no leerlos).
