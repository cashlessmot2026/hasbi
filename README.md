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
- Sugerencias de adiciones (“¿Le sumamos algo más?”) antes de cerrar el pedido
- Ticket PNG dibujado en canvas, subido a Supabase Storage; su enlace va en el mensaje de WhatsApp
- El pedido se guarda en la tabla `orders`

## Desarrollo
```bash
npm install
npm run dev          # http://localhost:5173/hasbi/
npm run build
```

## Base de datos
1. Supabase → SQL Editor → ejecutar `supabase/schema.sql` y luego `supabase/seed.sql`.
2. Para cambiar precios o productos: edita la tabla `products` en Supabase (la app la lee en vivo).
   Si editas `src/data/menu.js` (respaldo offline), regenera la semilla con `npm run seed:sql`.

Los pedidos se consultan en Supabase → Table editor → `orders` (los clientes solo pueden crear pedidos, no leerlos).
