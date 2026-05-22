# InmoIA360

Plataforma multi-cliente/multi-campaña de marketing inmobiliario.

## Arquitectura de rutas

```
https://inmoia360.com/{clientSlug}/{campaignSlug}
```

**Campaña activa:**
- Landing pública: `/delagala/dailycoffee`
- Admin dashboard: `/delagala/dailycoffee/admin`

## Stack

- **Framework**: Next.js 16 App Router (TypeScript)
- **Base de datos**: PostgreSQL / Neon (`schema: marketing_pilot`)
- **Auth admin**: Cookie JWT firmada con `DAILYCOFFEE_ADMIN_PASSWORD`
- **Deploy**: Vercel

## Variables de entorno

Copia `.env.example` a `.env.local` y rellena:

```
DATABASE_URL=postgres://...
DAILYCOFFEE_ADMIN_PASSWORD=tu-password-seguro
```

## Migración de base de datos

```bash
# Una sola vez, contra tu base Neon
node scripts/migrate.js
```

Crea el schema `marketing_pilot` con las tablas:
- `bars` — bares participantes
- `coffee_coupons` — cupones y leads
- `coffee_coupon_events` — log de eventos

## Desarrollo local

```bash
npm install
cp .env.example .env.local  # Rellenar DATABASE_URL y DAILYCOFFEE_ADMIN_PASSWORD
node scripts/migrate.js     # Solo la primera vez
npm run dev
```

## Deploy en Vercel

1. Conectar repo en [vercel.com](https://vercel.com)
2. Añadir variables de entorno en Settings → Environment Variables:
   - `DATABASE_URL` (desde Neon dashboard)
   - `DAILYCOFFEE_ADMIN_PASSWORD`
3. Deploy automático en cada push a `main`

## Flujo del cupón

```
Usuario → /delagala/dailycoffee
  → POST /api/delagala/dailycoffee/claim
  → INSERT marketing_pilot.coffee_coupons (status: 'generated')
  → INSERT coffee_coupon_events (coupon_generated)
  → Muestra código DLG-XXXXXXXX

Admin → /delagala/dailycoffee/admin/coupons
  → PATCH /api/admin/delagala/dailycoffee/coupons/:id { status: 'redeemed' }
  → UPDATE coffee_coupons
  → INSERT coffee_coupon_events (coupon_redeemed)
```

## Estados del cupón

| Estado | Descripción |
|--------|-------------|
| `generated` | Cupón creado, pendiente de visita |
| `claimed` | Lead llegó a la oficina |
| `redeemed` | Café entregado ✓ |
| `expired` | Expirado (30 días) |
| `cancelled` | Cancelado por admin |

## Aislamiento

Todos los datos de esta campaña viven en el schema `marketing_pilot`,
separado de cualquier tabla de producción de DELAGALA.
Las queries siempre usan namespace explícito: `marketing_pilot.coffee_coupons`, etc.
