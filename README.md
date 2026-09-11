# CuentaClarita 💰

Control de sueldo y deudas mensuales, simple y en español.

CuentaClarita es una app web para llevar el control de tu sueldo, tus deudas y cuánto dinero te queda disponible cada mes, sin planillas complicadas.

## Funcionalidades

- **Dashboard mensual**: resumen del sueldo, total de deudas y disponible del mes, de un vistazo.
- **Administrar meses**: crea y edita meses, registra tu sueldo y agrega o elimina deudas asociadas.
- **Historial**: revisa meses anteriores y cómo evolucionaron tus finanzas.
- **Autenticación segura**: registro e inicio de sesión con Supabase Auth, protegido con rate limiting.
- **Datos aislados por usuario**: cada persona solo ve y edita su propia información, reforzado con Row Level Security (RLS) en la base de datos.

## Stack técnico

- [Next.js](https://nextjs.org/) (App Router)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- [Supabase](https://supabase.com/) — autenticación, base de datos Postgres, RLS y funciones RPC
- Desplegado en [Vercel](https://vercel.com/)

## Empezando

### Requisitos

- Node.js 18+
- Una cuenta y proyecto en [Supabase](https://supabase.com/)

### Instalación

```bash
git clone https://github.com/Victor-tadashi/CuentaClarita.git
cd CuentaClarita
npm install
```

### Variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto con:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

⚠️ `SUPABASE_SERVICE_ROLE_KEY` tiene privilegios administrativos y **nunca** debe exponerse al cliente — se usa exclusivamente en rutas de servidor (`app/api/`).

### Base de datos

El esquema está versionado en `supabase/migrations/`. Para aplicarlo a tu propio proyecto de Supabase:

```bash
supabase db push
```

Esto crea las tablas `months` y `debts`, sus políticas de RLS y las funciones RPC (`create_month_with_debts`, `delete_month_with_debts`).

### Correr en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) para ver la app.

## Estructura del proyecto

```
app/
  api/auth/       # Endpoints de registro/login (server-side)
  dashboard/      # Vista principal: resumen del mes
  meses/          # Administrar meses
  historial/      # Historial de meses anteriores
  login/          # Autenticación
supabase/
  migrations/     # Esquema versionado de la base de datos
```

## Seguridad

- Row Level Security (RLS) habilitado en todas las tablas, con políticas filtradas por usuario autenticado.
- Rate limiting en el endpoint de registro.
- Headers de seguridad configurados en `next.config.mjs`.
- La service role key de Supabase se usa exclusivamente en rutas server-side, nunca en el cliente.

## Despliegue

La app está desplegada en Vercel: [cuentaclarita.vercel.app](https://cuentaclarita.vercel.app)

Cada merge a `main` se despliega automáticamente.

## Desarrollado con v0

Este proyecto nació como un proyecto de [v0](https://v0.app/). Puedes seguir desarrollándolo desde ahí — cada chat nuevo en v0 empuja los commits directamente a este repositorio:

[Continuar en v0 →](https://v0.app/chat/projects/prj_fA91DmUF6iXSjacfkFe5iGW6tmNB)
