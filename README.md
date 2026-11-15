# NeoAPPS Recepción

Recepcionista con IA para negocios pequeños (restaurantes, salones, clínicas,
talleres) que atiende llamadas y WhatsApp 24/7.

## Estado

| Fase | Contenido | Estado |
|---|---|---|
| 1 | Landing, autenticación, panel con catálogo y datos del negocio | Hecha |
| 2 | Agente en WhatsApp con pedidos | Pendiente |
| 3 | Citas, calendario y enlace de reservas | Pendiente |
| 4 | Voz | Pendiente |
| 5 | Pagos, suscripciones y panel de administrador | Pendiente |

## Estructura

- `apps/web`: Next.js (App Router) + TypeScript + Tailwind. Landing, panel y, más adelante, webhooks.
- `supabase/migrations`: esquema de Postgres con seguridad por filas (RLS). Cada tabla de negocio lleva `business_id`.
- `scripts/seed.mjs`: datos de demostración (Soda La Guaria y Salón Brisa).

Dónde cambiar lo más común:

- Nombre del producto: `apps/web/src/config/site.ts`
- Precios de la landing: `apps/web/src/config/pricing.ts`
- Textos: `apps/web/messages/es.json` (para inglés, crear `en.json` con las mismas claves)

## Correr en local

Requisitos: Node 22, pnpm y Docker (para Supabase local).

```bash
pnpm install
```

```bash
pnpm db:start
```

```bash
cp .env.example apps/web/.env.local
```

Complete `apps/web/.env.local` con `PUBLISHABLE_KEY` y `SECRET_KEY` que muestra `pnpm supabase status`.

```bash
pnpm db:seed
```

```bash
pnpm dev
```

Abra http://localhost:3000. Usuarios demo (contraseña `demo-recepcion`):

- `dueno.restaurante@demo.test` y `empleado.restaurante@demo.test`
- `dueno.salon@demo.test` y `empleado.salon@demo.test`

## Pruebas

```bash
pnpm test
```

Incluye pruebas de aislamiento entre negocios contra la base local (necesitan
`pnpm db:start` y `pnpm db:seed`).

## Producción

1. Crear un proyecto en Supabase y aplicar las migraciones con `pnpm supabase db push`.
2. Desplegar `apps/web` (por ejemplo en Vercel, con raíz `apps/web`) y definir las variables de `.env.example`.
3. En Supabase > Authentication > Email Templates, apuntar el enlace de confirmación a
   `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`.
