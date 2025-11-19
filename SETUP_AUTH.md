# Setup de Autenticação - NeoSale CRM

Este guia explica como configurar o sistema de autenticação completo com Supabase.

## 1. Instalar Dependências

```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs @supabase/ssr
```

## 2. Configurar Variáveis de Ambiente

Crie ou atualize o arquivo `.env.local` com as seguintes variáveis:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Como obter as chaves do Supabase:

1. Acesse [https://supabase.com](https://supabase.com)
2. Crie um novo projeto ou acesse um existente
3. Vá em **Settings** > **API**
4. Copie:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Mantenha em segredo!)

## 3. Executar Migrations no Supabase

### Opção A: Via Supabase Dashboard (Recomendado)

1. Acesse seu projeto no Supabase
2. Vá em **SQL Editor**
3. Clique em **New Query**
4. Copie e cole o conteúdo de `supabase/migrations/001_auth_schema.sql`
5. Execute a query
6. Repita para `002_create_super_admin.sql`

### Opção B: Via Supabase CLI

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Link ao projeto
supabase link --project-ref your-project-ref

# Executar migrations
supabase db push
```

## 4. Criar Usuário Super Admin

### Passo 1: Criar usuário no Supabase Auth

1. Acesse **Authentication** > **Users** no Supabase Dashboard
2. Clique em **Add User** > **Create new user**
3. Preencha:
   - **Email**: `neosaleai@gmail.com`
   - **Password**: `neosale*2028`
   - **Auto Confirm User**: ✅ Marque esta opção
4. Clique em **Create User**

### Passo 2: Atualizar perfil para Super Admin

Execute no **SQL Editor** do Supabase:

```sql
-- Atualizar o perfil para super_admin
UPDATE profiles
SET role = 'super_admin'
WHERE email = 'neosaleai@gmail.com';

-- Verificar se foi atualizado
SELECT * FROM profiles WHERE email = 'neosaleai@gmail.com';
```

## 5. Configurar OAuth Providers (Opcional)

Para habilitar login com Google, Apple e Microsoft:

### Google OAuth

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Crie um novo projeto ou selecione um existente
3. Ative a **Google+ API**
4. Vá em **Credentials** > **Create Credentials** > **OAuth 2.0 Client ID**
5. Configure:
   - **Application type**: Web application
   - **Authorized redirect URIs**: `https://your-project-ref.supabase.co/auth/v1/callback`
6. Copie **Client ID** e **Client Secret**
7. No Supabase: **Authentication** > **Providers** > **Google**
8. Cole as credenciais e ative

### Apple OAuth

1. Acesse [Apple Developer](https://developer.apple.com)
2. Vá em **Certificates, Identifiers & Profiles**
3. Crie um **Services ID**
4. Configure **Sign in with Apple**
5. No Supabase: **Authentication** > **Providers** > **Apple**
6. Configure com as credenciais

### Microsoft OAuth (Azure AD)

1. Acesse [Azure Portal](https://portal.azure.com)
2. Vá em **Azure Active Directory** > **App registrations**
3. Clique em **New registration**
4. Configure:
   - **Redirect URI**: `https://your-project-ref.supabase.co/auth/v1/callback`
5. Copie **Application (client) ID** e **Directory (tenant) ID**
6. Crie um **Client Secret**
7. No Supabase: **Authentication** > **Providers** > **Azure**
8. Cole as credenciais

## 6. Configurar Email Templates (Opcional)

Personalize os emails de convite, recuperação de senha, etc:

1. No Supabase: **Authentication** > **Email Templates**
2. Edite os templates:
   - **Confirm signup**
   - **Invite user**
   - **Magic Link**
   - **Change Email Address**
   - **Reset Password**

## 7. Estrutura do Banco de Dados

### Tabelas Criadas

- **profiles**: Perfis dos usuários
  - `id` (UUID, FK para auth.users)
  - `email` (TEXT)
  - `full_name` (TEXT)
  - `avatar_url` (TEXT)
  - `role` (user_role ENUM)
  - `created_at`, `updated_at`

- **client_members**: Relacionamento usuário-cliente
  - `id` (UUID)
  - `user_id` (UUID, FK para profiles)
  - `client_id` (UUID, FK para clients)
  - `role` (user_role ENUM)
  - `created_at`, `updated_at`

### Perfis de Usuário

- **super_admin**: Acesso total a todos os clientes (apenas neosaleai@gmail.com)
- **admin**: Pode gerenciar membros e configurações do cliente
- **member**: Pode criar e editar conteúdo
- **viewer**: Apenas visualização

## 8. Testar o Sistema

1. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

2. Acesse `http://localhost:3000/login`

3. Faça login com:
   - **Email**: `neosaleai@gmail.com`
   - **Senha**: `neosale*2028`

4. Teste as funcionalidades:
   - ✅ Login com email/senha
   - ✅ Login com OAuth (se configurado)
   - ✅ Cadastro de novo usuário
   - ✅ Recuperação de senha
   - ✅ Tela de membros
   - ✅ Convidar novos membros
   - ✅ Gerenciar perfis

## 9. Rotas Protegidas

O middleware em `src/middleware.ts` protege automaticamente todas as rotas, exceto:
- `/login`
- `/signup`
- `/reset-password`
- `/auth/*`

Usuários não autenticados serão redirecionados para `/login`.

## 10. Segurança

### Row Level Security (RLS)

Todas as tabelas têm RLS habilitado com políticas que garantem:
- Usuários só veem seus próprios dados
- Admins veem dados dos clientes que gerenciam
- Super admin vê tudo

### Boas Práticas

- ✅ Nunca exponha `SUPABASE_SERVICE_ROLE_KEY` no frontend
- ✅ Use `NEXT_PUBLIC_SUPABASE_ANON_KEY` no cliente
- ✅ Valide permissões no backend (API routes)
- ✅ Use HTTPS em produção
- ✅ Configure CORS adequadamente
- ✅ Habilite 2FA para super admin

## 11. Troubleshooting

### Erro: "Invalid API key"
- Verifique se as variáveis de ambiente estão corretas
- Reinicie o servidor após alterar `.env.local`

### Erro: "User not found"
- Confirme que o usuário foi criado no Supabase Auth
- Verifique se o perfil foi criado na tabela `profiles`

### Erro: "Permission denied"
- Verifique as políticas RLS
- Confirme que o usuário tem o perfil correto

### OAuth não funciona
- Verifique as redirect URIs
- Confirme que os providers estão habilitados no Supabase
- Verifique as credenciais OAuth

## 12. Próximos Passos

- [ ] Configurar 2FA para super admin
- [ ] Adicionar logs de auditoria
- [ ] Implementar rate limiting
- [ ] Adicionar testes automatizados
- [ ] Configurar backup automático
- [ ] Implementar notificações por email
- [ ] Adicionar dashboard de analytics

## Suporte

Para dúvidas ou problemas:
- Documentação Supabase: https://supabase.com/docs
- Documentação Next.js: https://nextjs.org/docs
