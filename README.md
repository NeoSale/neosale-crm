# 📊 NeoSale CRM

Dashboard CRM de gerenciamento de leads com agentes de IA, integração Evolution API (WhatsApp) e funcionalidades avançadas de vendas.

**Versão:** 1.18.14 | **Status:** Ativo | **Stack:** Next.js 15 (Turbopack) + React 19 + Tailwind CSS 4

## 🚀 Início Rápido

### Pré-requisitos
- Node.js 20+
- npm 10+
- Acesso à API NeoSale (localhost:3000)
- Credenciais Supabase (para autenticação)

### Instalação

```bash
npm install
```

### Desenvolvimento

```bash
npm run dev
```

Acesse `http://localhost:3000`

### Build & Produção

```bash
npm run build
npm start
```

## 📋 Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia com Turbopack (fast refresh) |
| `npm run build` | Build otimizado |
| `npm start` | Executa em produção |
| `npm run lint` | ESLint + TypeScript check |
| `npm run deploy` | Deploy automático (Docker + EasyPanel) |
| `npm run deploy:patch` | Force patch version |
| `npm run deploy:minor` | Force minor version |
| `npm run deploy:major` | Force major version |

## 📁 Estrutura do Projeto

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Páginas de autenticação
│   ├── api/               # Routes de API local
│   ├── agentes/           # Dashboard de agentes IA
│   ├── configuracoes/     # Painel de configurações
│   ├── layout.tsx
│   └── page.tsx
├── components/            # 20+ componentes
│   ├── Dashboard.tsx
│   ├── LeadsManager.tsx
│   ├── ChatManager.tsx
│   ├── AgentesManager.tsx
│   └── DataTable.tsx
├── services/              # 18+ API clients
│   ├── leadsApi.ts
│   ├── chatApi.ts
│   ├── evolutionApi.ts
│   └── ...
├── contexts/             # Auth, Cliente, Theme
├── hooks/                # Custom React hooks
├── lib/                  # Utilities
├── types/                # TypeScript types
└── middleware.ts         # Auth middleware
```

## 🎯 Recursos Principais

### Gerenciamento de Leads
- ✅ CRUD completo (criar, editar, deletar, buscar)
- ✅ Importação em bulk (Excel/CSV)
- ✅ Exportação de dados
- ✅ Filtros avançados e busca
- ✅ Estatísticas em tempo real

### Chat & Mensagens
- ✅ Histórico de conversas
- ✅ Integração Evolution API (WhatsApp)
- ✅ Agentes IA automáticos (SDR, Closer, Support)
- ✅ Transferência entre agentes

### Agentes IA
- ✅ **SDR Agent** - Qualificação de leads (SPIN Selling)
- ✅ **Closer Agent** - Fechamento de vendas
- ✅ **Support Agent** - Atendimento pós-venda

### Integrações
- ✅ Evolution API (WhatsApp)
- ✅ Google Calendar (agendamentos)
- ✅ Supabase (autenticação + banco)
- ✅ API NeoSale (backend)

## 🔧 Configuração

### Environment Variables

Crie `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=seu_projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
```

Veja [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) para completo.

## 📚 Documentação

- [SETUP.md](docs/SETUP.md) - Setup detalhado
- [ENVIRONMENT.md](docs/ENVIRONMENT.md) - Variáveis de ambiente
- [FEATURES.md](docs/FEATURES.md) - Features e funcionalidades
- [API.md](docs/API.md) - Integração com API backend

## 🚢 Deployment

### Docker

```bash
npm run deploy              # Auto-detecta versão
npm run deploy:patch        # 1.18.14 → 1.18.15
npm run deploy:minor        # 1.18.14 → 1.19.0
npm run deploy:major        # 1.18.14 → 2.0.0
```

**Processo:**
1. Detecta versão (git commits)
2. Atualiza `package.json`
3. Build Docker image
4. Push para Docker Hub
5. Commit + tag no Git
6. Deploy automático em EasyPanel (se token configurado)

Veja [../../DEPLOYMENT.md](../../neosale-docs/DEPLOYMENT.md) para detalhes.

## 📦 Dependências Principais

- **next:** Turbopack enabled
- **react:** v19
- **@dnd-kit:** Drag & drop
- **@supabase:** Auth + Database
- **tailwindcss:** Styling
- **xlsx:** Excel import/export
- **react-datepicker:** Date picker
- **react-hot-toast:** Notifications

## 🤝 Contribuindo

1. Crie branch: `git checkout -b feature/sua-feature`
2. Commit: `git commit -m 'feat: descrição'`
3. Push: `git push origin feature/sua-feature`
4. Pull Request

## 🐛 Troubleshooting

### API não responde
```bash
# Verifique se API está rodando
cd ../neosale-api
npm run dev
```

### Erro de autenticação
```bash
# Verifique variáveis Supabase em .env.local
# Verifique se Supabase está acessível
```

### Build lento (Turbopack)
```bash
# Limpe cache
rm -rf .next
npm run dev
```

## 📊 Monitoramento

### Performance
- Check bundle size: `npm run build` (mostra tamanho por rota)
- Performance profiling: F12 → Performance tab

### Logs
- Verificar console (F12)
- Logs de API em backend
- Supabase logs no painel

## 📝 Licença

MIT

## 📞 Suporte

- **Issues:** GitHub Issues
- **Email:** dev@neosale.io
- **Docs:** [neosale-docs/](../neosale-docs)

---

**Mantido por:** Equipe NeoSale
**Última atualização:** Fevereiro 2026
