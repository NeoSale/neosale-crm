# 👤 Como Criar o Super Admin

## 📋 Credenciais do Super Admin

- **Email:** neosaleai@gmail.com
- **Senha:** neosale*2028
- **Perfil:** super_admin (acesso a todos os clientes)

---

## 🚀 Passo a Passo

### 1️⃣ Executar Migrations (Se ainda não fez)

No **Supabase Dashboard** > **SQL Editor**, execute:

#### Migration 1: Schema
```sql
-- Cole o conteúdo de: supabase/migrations/001_auth_schema.sql
```

#### Migration 2: Super Admin Setup
```sql
-- Cole o conteúdo de: supabase/migrations/002_create_super_admin.sql
```

---

### 2️⃣ Criar Usuário no Supabase Auth

1. Acesse: **Supabase Dashboard** > **Authentication** > **Users**
2. Clique em **"Add User"** ou **"Invite User"**
3. Preencha:
   - **Email:** `neosaleai@gmail.com`
   - **Password:** `neosale*2028`
   - ✅ Marque: **"Auto Confirm User"** (importante!)
4. Clique em **"Create User"** ou **"Send Invitation"**

---

### 3️⃣ Definir Role como Super Admin

No **SQL Editor**, execute:

```sql
-- Atualizar o perfil para super_admin
UPDATE profiles 
SET role = 'super_admin' 
WHERE email = 'neosaleai@gmail.com';
```

---

### 4️⃣ Verificar

Execute no **SQL Editor**:

```sql
-- Verificar se o usuário foi criado corretamente
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.created_at
FROM profiles p
WHERE p.email = 'neosaleai@gmail.com';
```

**Resultado esperado:**
```
id                  | email                | full_name | role        | created_at
--------------------|----------------------|-----------|-------------|------------
[uuid]              | neosaleai@gmail.com  | null      | super_admin | [timestamp]
```

---

## ✅ Testar Login

1. Acesse: http://localhost:3002/login
2. Digite:
   - **Email:** neosaleai@gmail.com
   - **Senha:** neosale*2028
3. Clique em **"Entrar"**
4. Você deve ser redirecionado para o dashboard
5. Como super admin, você terá acesso a **todos os clientes**

---

## 🔐 Permissões do Super Admin

O super admin tem:
- ✅ Acesso a **todos os clientes** (sem restrições)
- ✅ Pode gerenciar **todos os membros**
- ✅ Pode criar, editar e deletar qualquer conteúdo
- ✅ Acesso total a todas as funcionalidades
- ✅ Único usuário com perfil `super_admin`

---

## 🐛 Problemas Comuns

### Erro: "Invalid login credentials"
- ✅ Verifique se o email está correto: `neosaleai@gmail.com`
- ✅ Verifique se a senha está correta: `neosale*2028`
- ✅ Certifique-se de que marcou "Auto Confirm User"

### Erro: "User not found"
- ✅ Verifique se o usuário foi criado no Authentication > Users
- ✅ Execute a query de verificação no SQL Editor

### Perfil não é super_admin
- ✅ Execute novamente o UPDATE no SQL Editor
- ✅ Faça logout e login novamente

### Não vê todos os clientes
- ✅ Verifique se o role é realmente `super_admin`
- ✅ Limpe o cache do navegador
- ✅ Faça logout e login novamente

---

## 📝 Comandos Úteis

### Ver todos os perfis
```sql
SELECT * FROM profiles ORDER BY created_at DESC;
```

### Ver membros de um cliente específico
```sql
SELECT 
  cm.*,
  p.email,
  p.full_name,
  p.role
FROM client_members cm
JOIN profiles p ON p.id = cm.user_id
WHERE cm.client_id = 'seu-client-id';
```

### Resetar senha do super admin
```sql
-- No Supabase Dashboard > Authentication > Users
-- Clique no usuário > Reset Password
-- Ou use a tela de reset de senha: /reset-password
```

---

## 🎯 Próximos Passos

Após criar o super admin:

1. ✅ Faça login com as credenciais
2. ✅ Acesse **Configurações** > **Membros**
3. ✅ Convide outros usuários
4. ✅ Defina perfis (admin, member, viewer)
5. ✅ Teste as permissões

---

## 🔒 Segurança

⚠️ **IMPORTANTE:**
- Guarde essas credenciais em local seguro
- Não compartilhe a senha
- Em produção, altere a senha imediatamente
- Use autenticação de dois fatores se disponível
- Considere usar OAuth (Google, Apple, Microsoft)

---

## 📚 Referências

- **SETUP_AUTH.md** - Guia completo de configuração
- **AUTH_README.md** - Resumo do sistema de autenticação
- **supabase/migrations/** - Scripts de migração
