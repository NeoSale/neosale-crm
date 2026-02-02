# 🛠️ Setup - NeoSale CRM

## Pré-requisitos

- Node.js 20+
- npm 10+
- API NeoSale rodando (`npm run dev` em neosale-api)
- Conta Supabase com projeto configurado

## Instalação Rápida

```bash
npm install
```

## Configurar Environment

Crie `.env.local` na raiz:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
NEXT_PUBLIC_SUPABASE_KEY=sua-chave-secret
```

**Obter credenciais Supabase:**
1. Abra https://app.supabase.com
2. Selecione seu projeto
3. Settings → API
4. Copie URL e ANON_KEY

## Iniciar Desenvolvimento

```bash
# Terminal 1: API
cd ../neosale-api
npm run dev

# Terminal 2: CRM
cd ../neosale-crm
npm run dev
```

Acesse `http://localhost:3000`

## Troubleshooting

### "API não responde"
```bash
# Verifique se API está rodando em http://localhost:3000/api/health
curl http://localhost:3000/api/health
```

### "Erro de autenticação"
```bash
# Verifique credenciais Supabase em .env.local
# Teste conexão: Console do navegador (F12)
```

### "Turbopack error"
```bash
rm -rf .next
npm run dev
```

---

Veja [ENVIRONMENT.md](ENVIRONMENT.md) para variáveis completas.
