# 🔐 Sistema de Autenticação - NeoSale CRM

Sistema completo de autenticação com Supabase, incluindo OAuth e gerenciamento de membros.

## 🚀 Quick Start

### 1. Instalar Dependências
```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs @supabase/ssr
```

### 2. Configurar Variáveis de Ambiente
Crie `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Executar Migrations
No Supabase Dashboard > SQL Editor, execute:
1. `supabase/migrations/001_auth_schema.sql`
2. `supabase/migrations/002_create_super_admin.sql`

### 4. Criar Super Admin
1. No Supabase: **Authentication** > **Users** > **Add User**
2. Email: `neosaleai@gmail.com` | Senha: `neosale*2028`
3. Marque "Auto Confirm User"
4. Execute no SQL Editor:
```sql
UPDATE profiles SET role = 'super_admin' WHERE email = 'neosaleai@gmail.com';
```

### 5. Iniciar
```bash
npm run dev
```

Acesse: `http://localhost:3000/login`

## 📁 Estrutura Criada

### Telas
- ✅ `/login` - Login com email/senha e OAuth
- ✅ `/signup` - Cadastro de novos usuários
- ✅ `/reset-password` - Recuperação de senha
- ✅ `/members` - Gerenciamento de membros

### OAuth Providers
- Google
- Apple  
- Microsoft (Azure AD)

### Perfis de Usuário
- **super_admin** - Acesso total (apenas neosaleai@gmail.com)
- **admin** - Gerencia membros e configurações
- **member** - Cria e edita conteúdo
- **viewer** - Apenas visualização

### Funcionalidades da Tela de Membros
- ✅ Listar membros por cliente
- ✅ Convidar novos membros (via email)
- ✅ Reenviar convite
- ✅ Resetar senha
- ✅ Alterar perfil (admin/super_admin)
- ✅ Remover membro
- ✅ Buscar membros

## 🔒 Segurança

### Row Level Security (RLS)
Todas as tabelas têm políticas RLS que garantem:
- Usuários só veem seus próprios dados
- Admins veem dados dos clientes que gerenciam
- Super admin vê tudo

### Middleware
Protege automaticamente todas as rotas, exceto:
- `/login`, `/signup`, `/reset-password`, `/auth/*`

## 🎨 Dark Mode

Todas as telas de autenticação suportam dark mode automaticamente através do sistema de CSS Variables existente.

## 📚 Documentação Completa

Para instruções detalhadas, incluindo configuração de OAuth providers, veja: **SETUP_AUTH.md**

## 🛠️ Arquivos Principais

### Backend
- `src/lib/supabase/client.ts` - Cliente Supabase (browser)
- `src/lib/supabase/server.ts` - Cliente Supabase (server)
- `src/lib/supabase/middleware.ts` - Middleware de autenticação
- `src/middleware.ts` - Middleware Next.js

### Contextos
- `src/contexts/AuthContext.tsx` - Contexto de autenticação
- `src/hooks/useRequireAuth.ts` - Hook para proteger páginas

### API Routes
- `src/app/api/members/invite/route.ts` - Convidar membros
- `src/app/api/members/resend-invite/route.ts` - Reenviar convite

### Tipos
- `src/types/auth.ts` - Tipos TypeScript

### Migrations
- `supabase/migrations/001_auth_schema.sql` - Schema do banco
- `supabase/migrations/002_create_super_admin.sql` - Super admin

## ⚡ Uso no Código

### Obter usuário autenticado
```tsx
import { useAuth } from '@/contexts/AuthContext'

function MyComponent() {
  const { user, profile, clients, loading } = useAuth()
  
  if (loading) return <div>Carregando...</div>
  if (!user) return <div>Não autenticado</div>
  
  return <div>Olá, {profile?.full_name}!</div>
}
```

### Proteger página por perfil
```tsx
import { useRequireAuth } from '@/hooks/useRequireAuth'

function AdminPage() {
  const { user, profile, loading } = useRequireAuth('admin')
  
  // Redireciona automaticamente se não for admin
  return <div>Conteúdo admin</div>
}
```

### Fazer logout
```tsx
const { signOut } = useAuth()

<button onClick={signOut}>Sair</button>
```

## 🐛 Troubleshooting

### Erro: "Invalid API key"
→ Verifique `.env.local` e reinicie o servidor

### Erro: "User not found"
→ Confirme que o usuário foi criado no Supabase Auth

### Erro: "Permission denied"
→ Verifique as políticas RLS e o perfil do usuário

### OAuth não funciona
→ Configure os providers no Supabase Dashboard

## 📞 Suporte

- [Documentação Supabase](https://supabase.com/docs)
- [Documentação Next.js](https://nextjs.org/docs)
- Veja **SETUP_AUTH.md** para guia completo
