# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

**neosale-crm** is a Next.js 15 CRM dashboard for lead management built with React 19, TypeScript, and Tailwind CSS 4. It uses Turbopack for fast development builds and integrates with Supabase for authentication and data management.

This project is part of the NeoSale monorepo but operates independently with its own dependencies.

**Version:** 1.18.13+ | **Status:** Active | **Stack:** Next.js 15 (Turbopack) + React 19 + Tailwind CSS 4

## Common Commands

### Development

```bash
npm install                  # Install dependencies
npm run dev                  # Start dev server with Turbopack on port 3001
npm run build                # Production build
npm start                    # Run production build locally on port 3001
npm run lint                 # ESLint check
```

### Version Management

```bash
npm run version:patch        # Bump patch version (1.18.13 → 1.18.14)
npm run version:minor        # Bump minor version (1.18.13 → 1.19.0)
npm run version:major        # Bump major version (1.18.13 → 2.0.0)
npm run update-version       # Sync version to src/utils/version.ts
```

### Docker & Deployment

```bash
npm run deploy               # Auto-detect version, build Docker image, push to Docker Hub
npm run docker:build         # Build Docker image locally
npm run docker:run           # Run Docker container
npm run docker:compose       # Run with docker-compose
npm run docker:pull          # Pull latest image from Docker Hub
```

## Architecture

### Project Structure

```
src/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Auth layout (login, signup, reset-password)
│   ├── api/                 # API routes (routes, middleware for backend calls)
│   ├── agentes/             # AI agents dashboard
│   ├── chat/                # Chat interface
│   ├── configuracoes/       # Settings (negocio, followup)
│   ├── base/                # Base page
│   ├── layout.tsx           # Root layout with theme script, font loading
│   └── page.tsx             # Home/Dashboard page
├── components/              # React components (~20+ components)
│   ├── ClientLayout.tsx     # Client-side wrapper with contexts
│   ├── Dashboard.tsx        # Main dashboard
│   ├── DataTable.tsx        # Reusable data table
│   ├── LeadsManager.tsx     # Lead CRUD interface
│   ├── ChatManager.tsx      # Chat interface
│   └── ...                  # Other feature components
├── services/                # API client functions (~18+ services)
│   ├── baseApi.ts           # Base HTTP client with auth interceptor
│   ├── leadsApi.ts          # Lead CRUD operations
│   ├── chatApi.ts           # Chat operations
│   ├── evolutionApi.ts      # WhatsApp Evolution API
│   ├── agentesApi.ts        # AI agents API
│   ├── mensagensApi.ts      # Messages API
│   └── ...                  # Other integrations
├── contexts/                # React context providers
│   ├── AuthContext.tsx      # User auth state & profile management
│   ├── ClienteContext.tsx   # Selected client/company state
│   └── ThemeContext.tsx     # Dark/light theme state
├── hooks/                   # Custom React hooks
│   ├── useRequireAuth.ts    # Auth guard for protected routes
│   ├── useLeads.ts          # Lead state management
│   └── useClienteData.ts    # Client data management
├── lib/                     # Utilities & helpers
│   ├── supabase/            # Supabase client setup & middleware
│   └── ...                  # Other utilities
├── types/                   # TypeScript type definitions
├── utils/                   # Utility functions
│   ├── version.ts           # Version management utilities
│   └── ...
├── middleware.ts            # Next.js middleware (Supabase session management)
└── styles/
    └── globals.css          # Global styles with Tailwind
```

### Key Architectural Patterns

**Authentication & Session:**
- Supabase Auth with JWT tokens
- Session management via middleware (`src/middleware.ts`)
- `AuthContext` provides user, profile, and cliente state
- Protected routes use `useRequireAuth()` hook
- Automatic theme restoration on page load (via layout script)

**Data Management:**
- `baseApi.ts` is the central HTTP client with:
  - Request/response interceptors
  - Automatic JWT token injection
  - Toast notifications for errors
  - Base URL from `NEXT_PUBLIC_API_URL`
- All services extend or use `baseApi.ts`
- API routes in `app/api/` proxy backend calls with auth validation

**Component Structure:**
- `ClientLayout.tsx` wraps children with `AuthProvider`, `ThemeProvider`, `ClienteProvider`
- Components are mostly functional with React hooks
- Large features (Dashboard, LeadsManager, ChatManager) are in separate component files
- Reusable UI components stored in `components/` (DataTable, modals, forms)

**API Routes Pattern:**
- `app/api/` routes handle frontend-to-backend communication
- Routes validate auth, proxy requests, or manage local state (configs, sessions)
- Example: `app/api/leads/route.ts` → GET/POST/PUT/DELETE lead operations
- Example: `app/api/configuracoes/[id]/route.ts` → Settings CRUD with key-based lookups

## Environment Variables

### Development (`.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3000          # Backend API endpoint
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_SUPABASE_KEY=your_service_role_key     # Optional for server operations

# Optional integrations:
NEXT_PUBLIC_EVOLUTION_API_URL=http://localhost:8080
NEXT_PUBLIC_EVOLUTION_API_KEY=your_evolution_key
NEXT_PUBLIC_GOOGLE_CALENDAR_ID=your_calendar_id@group.calendar.google.com
```

See `docs/ENVIRONMENT.md` for complete list and setup instructions.

### Production (Docker/EasyPanel)

Environment variables are set in deployment configuration:
- `NEXT_PUBLIC_API_URL` → Production backend URL
- `NEXT_PUBLIC_SUPABASE_URL` → Supabase project URL
- Other credentials from your secret management system

**Note:** All `NEXT_PUBLIC_*` variables are embedded at build time and visible in client code—never put secrets here.

## Development Tips

### Running Locally with Dependencies

**Prerequisites:**
- neosale-api running on port 3000 (`cd ../neosale-api && npm run dev`)
- Supabase project with valid credentials in `.env.local`

**Full stack startup:**
```bash
# Terminal 1: Backend API
cd ../neosale-api
npm run dev

# Terminal 2: CRM Frontend
cd ../neosale-crm
npm run dev              # Runs on http://localhost:3001
```

### Turbopack Development

The project uses Next.js 15 with Turbopack for faster dev builds. If you encounter issues:

```bash
rm -rf .next            # Clear Next.js cache
npm run dev             # Restart dev server
```

### Adding a New API Route

1. Create file in `src/app/api/[feature]/route.ts`
2. Export handlers: `export async function GET/POST/PUT/DELETE(req, res) { ... }`
3. Use auth middleware if needed: validate JWT token from cookies
4. Call backend via `NEXT_PUBLIC_API_URL` or Supabase directly
5. Example pattern (see `src/app/api/leads/route.ts`):
   ```typescript
   import { createClient } from '@/lib/supabase/server'
   import { NextRequest, NextResponse } from 'next/server'

   export async function GET(request: NextRequest) {
     const supabase = createClient()
     const { data: { user } } = await supabase.auth.getUser()

     if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

     // Fetch data from backend API or database
     const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/leads`)
     return NextResponse.json(await res.json())
   }
   ```

### Adding a New Service

1. Create file in `src/services/featureApi.ts`
2. Import and extend `baseApi` from `baseApi.ts`
3. Export functions that make HTTP calls
4. Example pattern:
   ```typescript
   import { baseApi } from './baseApi'

   export const myFeatureApi = {
     getAll: () => baseApi.get('/feature'),
     create: (data) => baseApi.post('/feature', data),
     update: (id, data) => baseApi.put(`/feature/${id}`, data),
   }
   ```

### Working with Supabase

- **Auth:** Use `createClient()` from `@/lib/supabase/client` (client-side)
- **Server-side:** Use `createClient()` from `@/lib/supabase/server` (in API routes)
- **Session management:** Handled by middleware + `AuthContext`
- **Direct DB queries:** Possible but prefer backend API endpoints for consistency

### Styling & Tailwind

- Uses Tailwind CSS 4 (see `tailwind.config.js`)
- Dark mode supported via `dark:` class prefix
- Custom theme colors in tailwind config (primary: #403CCF)
- Global styles in `src/styles/globals.css`
- Dark mode state stored in localStorage and managed by `ThemeContext`

## Testing & Linting

```bash
npm run lint             # ESLint check (uses Next.js config)
```

No test framework currently configured—testing is manual.

## Deployment

### Docker Build Process

Deployment scripts (`build-and-push.sh`, `scripts/start-docker.sh`) handle:
1. Version detection from git tags/commits
2. Update `package.json` version
3. Build Docker image
4. Push to Docker Hub (`brunobspaiva/neosale-crm:latest`)
5. Auto-commit and tag in Git
6. Deploy to EasyPanel (if `EASYPANEL_TOKEN` is set)

**Dockerfile:**
- Multi-stage build (node builder → alpine runtime)
- Non-root user execution
- Runs on port 3000 (remapped from 3001)
- Health checks included

### Version Management

Version is stored in `package.json` and synced to `src/utils/version.ts` during build via `scripts/update-version.js`. This allows runtime access to app version for analytics/debugging.

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `next` | Framework with App Router & Turbopack |
| `react` / `react-dom` | UI library (v19) |
| `@supabase/supabase-js` | Auth & database client |
| `@supabase/ssr` | SSR-safe Supabase hooks |
| `@dnd-kit/*` | Drag-and-drop functionality |
| `tailwindcss` | CSS framework (v4) |
| `lucide-react` | Icon library |
| `@heroicons/react` | Icon library (Heroicons) |
| `react-datepicker` | Date picker component |
| `react-hot-toast` | Toast notifications |
| `xlsx` | Excel import/export |
| `date-fns` | Date manipulation |

## Common Debugging Scenarios

### "API not responding"

Check that neosale-api is running:
```bash
curl http://localhost:3000/api/health
```

If 404/timeout, start API: `cd ../neosale-api && npm run dev`

### "Supabase connection errors"

1. Verify `.env.local` has correct `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. Check Supabase project is active in console
3. Ensure row-level security (RLS) policies allow authenticated reads

### "Turbopack build errors"

Clear cache and restart:
```bash
rm -rf .next node_modules/.cache
npm run dev
```

### "Auth redirects to login loop"

- Verify JWT token in cookies (DevTools → Application → Cookies)
- Check `AuthContext` is initialized and `useRequireAuth()` runs on mount
- Check middleware correctly updates session (`src/middleware.ts`)

### "Build size too large"

Run build and check output:
```bash
npm run build
```

Use bundle analyzer to identify large dependencies. Next.js shows per-route sizes.

## Important Notes

- **Next.js Standalone Output:** Build uses `output: 'standalone'` in `next.config.ts` for Docker deployments
- **ESLint:** Errors ignored during build (`ignoreDuringBuilds: true`) to prevent CI/CD failures
- **Rewrites:** API calls to `/api/*` are rewritten to backend URL in dev (see `next.config.ts`)
- **Monorepo Context:** This project is part of NeoSale monorepo but has independent npm dependencies
- **Turbopack:** Enabled by default—provides much faster builds than webpack in Next.js 15

## File Structure Quick Reference

| Path | Purpose |
|------|---------|
| `src/app/(auth)/` | Authentication pages (login, signup, reset) |
| `src/app/api/` | Backend proxy routes & local API logic |
| `src/components/` | React components |
| `src/services/` | API client functions |
| `src/contexts/` | React context providers |
| `src/hooks/` | Custom React hooks |
| `src/lib/supabase/` | Supabase client & middleware |
| `src/types/` | TypeScript interfaces |
| `docs/` | Documentation (SETUP, ENVIRONMENT) |
| `scripts/` | Build & deployment scripts |
| `.env.local` | Local development secrets (git-ignored) |
| `tailwind.config.js` | Tailwind CSS configuration |
| `tsconfig.json` | TypeScript configuration |
| `next.config.ts` | Next.js configuration |

