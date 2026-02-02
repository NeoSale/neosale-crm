# 🔐 Variáveis de Ambiente - NeoSale CRM

## `.env.local` (Desenvolvimento)

```env
# API Backend
NEXT_PUBLIC_API_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Opcional: Evolution API
NEXT_PUBLIC_EVOLUTION_API_URL=http://localhost:8080
NEXT_PUBLIC_EVOLUTION_API_KEY=sua-chave-evolution

# Opcional: Google Calendar
NEXT_PUBLIC_GOOGLE_CALENDAR_ID=seu-calendario-id@group.calendar.google.com
```

## Produção (Docker/EasyPanel)

Defina variáveis no painel de configuração:

```
NEXT_PUBLIC_API_URL=https://api.neosale.io
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Obtenção de Credenciais

### Supabase
1. https://app.supabase.com
2. Project Settings → API
3. Copy: URL, ANON_KEY, SERVICE_ROLE_KEY

### Evolution API
1. Obtenha em seu painel Evolution
2. Use como `NEXT_PUBLIC_EVOLUTION_API_KEY`

### Google Calendar
1. Google Cloud Console → Create Project
2. Enable Calendar API
3. Create OAuth credentials
4. Obtenha Calendar ID

## Segurança

- ✅ Nunca commitar `.env.local`
- ✅ NEXT_PUBLIC_* é visível no cliente (OK)
- ✅ Usar variáveis privadas para dados sensíveis (não implementado aqui)
- ✅ Diferentes valores por ambiente

## Build-time vs Runtime

**Build-time** (durante build):
- Variáveis NEXT_PUBLIC_* substituídas no código
- Definidas no momento do build

**Runtime** (durante execução):
- Este projeto é frontend-only
- Sem variáveis runtime
- Todas as config são em build-time

---

Veja [SETUP.md](SETUP.md) para setup inicial.
