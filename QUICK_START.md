# 🚀 Quick Start - Sistema de Autenticação

## Passo a Passo Rápido

### 1️⃣ Instalar Dependências
```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs @supabase/ssr
```

### 2️⃣ Configurar Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. Copie as credenciais em **Settings** > **API**
3. Crie `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3️⃣ Executar Migrations

No Supabase Dashboard > **SQL Editor**, execute:

**Migration 1:** `supabase/migrations/001_auth_schema.sql`
**Migration 2:** `supabase/migrations/002_create_super_admin.sql`

### 4️⃣ Criar Super Admin

1. **Authentication** > **Users** > **Add User**
   - Email: `neosaleai@gmail.com`
   - Password: `neosale*2028`
   - ✅ Auto Confirm User

2. No **SQL Editor**, execute:
```sql
UPDATE profiles SET role = 'super_admin' WHERE email = 'neosaleai@gmail.com';
```

### 5️⃣ Iniciar Aplicação
```bash
npm run dev
```

Acesse: **http://localhost:3000/login**

---

## ✅ Pronto!

Você agora tem:
- ✅ Login com email/senha
- ✅ Login com OAuth (Google, Apple, Microsoft)
- ✅ Cadastro de usuários
- ✅ Recuperação de senha
- ✅ Gerenciamento de membros
- ✅ 4 perfis de usuário (super_admin, admin, member, viewer)
- ✅ Dark mode automático
- ✅ Proteção de rotas

## 📚 Documentação Completa

- **AUTH_README.md** - Guia resumido
- **SETUP_AUTH.md** - Guia detalhado com OAuth

## 🎯 Testar

1. Login: `neosaleai@gmail.com` / `neosale*2028`
2. Acesse: **Configurações** > **Membros**
3. Convide novos membros
4. Teste os perfis e permissões

## 🐛 Problemas?

- Verifique `.env.local`
- Confirme que as migrations foram executadas
- Verifique se o super admin foi criado
- Reinicie o servidor após alterar variáveis de ambiente
