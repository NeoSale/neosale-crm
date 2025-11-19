# 🔍 Troubleshooting: Perfil não está carregando

## 🎯 Problema

O perfil do usuário não está sendo exibido no header do AdminLayout.

---

## ✅ Checklist de Verificação

### 1. Verificar Console do Navegador

Abra o Console (F12) e procure por:

```
🚀 AuthContext: Inicializando...
📝 Sessão obtida: Usuário logado
👤 User ID: [uuid]
🔍 Buscando perfil para userId: [uuid]
✅ Perfil encontrado: { id, email, role, ... }
AdminLayout - User: { ... }
AdminLayout - Profile: { ... }
```

**Se aparecer:**
- ❌ `Sessão obtida: Sem usuário` → Você não está logado
- ❌ `Erro ao buscar perfil` → Problema no banco de dados
- ❌ `Profile: null` → Usuário não tem perfil criado

---

### 2. Verificar se Você Está Logado

No Console, execute:
```javascript
// Verificar sessão
const { data } = await (await fetch('/api/auth/session')).json()
console.log('Sessão:', data)
```

**Ou simplesmente:**
- Tente fazer logout e login novamente
- Acesse: http://localhost:3002/login

---

### 3. Verificar se a Tabela `profiles` Existe

No **Supabase Dashboard** > **SQL Editor**, execute:

```sql
-- Verificar se a tabela existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'profiles'
);
```

**Resultado esperado:** `true`

**Se for `false`:**
- Execute a migration: `001_auth_schema_safe.sql`

---

### 4. Verificar se Seu Usuário Tem Perfil

No **SQL Editor**, execute:

```sql
-- Ver todos os usuários e seus perfis
SELECT 
  u.id,
  u.email,
  u.created_at as user_created,
  p.id as profile_id,
  p.role,
  p.full_name
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
ORDER BY u.created_at DESC;
```

**Se seu usuário NÃO tem perfil (profile_id = null):**
- Execute: `003_check_and_create_profiles.sql`

---

### 5. Criar Perfil Manualmente

Se o perfil não foi criado automaticamente, crie manualmente:

```sql
-- Substitua [SEU_USER_ID] e [SEU_EMAIL]
INSERT INTO public.profiles (id, email, role, created_at, updated_at)
VALUES (
  '[SEU_USER_ID]',  -- Copie o ID do auth.users
  '[SEU_EMAIL]',
  'admin',  -- ou 'super_admin', 'member', 'viewer'
  NOW(),
  NOW()
);
```

**Para pegar seu User ID:**
```sql
SELECT id, email FROM auth.users WHERE email = 'seu@email.com';
```

---

### 6. Verificar Trigger

O trigger `on_auth_user_created` deve criar o perfil automaticamente. Verifique se existe:

```sql
-- Verificar se o trigger existe
SELECT 
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

**Se não existir:**
- Execute: `001_auth_schema_safe.sql`

---

### 7. Testar o Trigger

Crie um usuário de teste para ver se o trigger funciona:

```sql
-- No Supabase Dashboard > Authentication > Users
-- Clique em "Add User"
-- Email: teste@exemplo.com
-- Password: teste123
-- Auto Confirm: ✅

-- Depois verifique se o perfil foi criado:
SELECT * FROM public.profiles WHERE email = 'teste@exemplo.com';
```

---

## 🔧 Soluções Rápidas

### Solução 1: Recriar Perfil

```sql
-- 1. Deletar perfil existente (se houver)
DELETE FROM public.profiles WHERE email = 'seu@email.com';

-- 2. Criar novo perfil
INSERT INTO public.profiles (id, email, role, created_at, updated_at)
SELECT 
  id,
  email,
  'admin' as role,
  created_at,
  NOW() as updated_at
FROM auth.users
WHERE email = 'seu@email.com';
```

### Solução 2: Executar Script de Verificação

No **SQL Editor**, execute todo o conteúdo de:
```
supabase/migrations/003_check_and_create_profiles.sql
```

Isso vai:
1. Listar usuários sem perfil
2. Criar perfis para todos os usuários
3. Mostrar estatísticas
4. Listar todos os perfis

### Solução 3: Fazer Logout e Login

1. Clique em **Sair** no menu do usuário
2. Faça login novamente
3. Verifique o console

---

## 🐛 Erros Comuns

### Erro: "relation 'profiles' does not exist"

**Causa:** A tabela não foi criada.

**Solução:**
```sql
-- Execute a migration completa
-- Cole o conteúdo de: 001_auth_schema_safe.sql
```

### Erro: "null value in column 'id' violates not-null constraint"

**Causa:** Tentando inserir perfil sem ID.

**Solução:**
```sql
-- Use o ID do auth.users
INSERT INTO public.profiles (id, email, role)
SELECT id, email, 'viewer'
FROM auth.users
WHERE email = 'seu@email.com';
```

### Erro: "duplicate key value violates unique constraint"

**Causa:** Perfil já existe.

**Solução:**
```sql
-- Atualizar ao invés de inserir
UPDATE public.profiles
SET role = 'admin', updated_at = NOW()
WHERE email = 'seu@email.com';
```

---

## 📊 Verificação Final

Após aplicar as soluções, execute:

```sql
-- 1. Verificar seu perfil
SELECT * FROM public.profiles WHERE email = 'seu@email.com';

-- 2. Verificar trigger
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 3. Contar perfis
SELECT COUNT(*) FROM public.profiles;
```

**Resultado esperado:**
- ✅ Seu perfil existe com role definido
- ✅ Trigger existe e está ativo
- ✅ Número de perfis = número de usuários

---

## 🔄 Recarregar Aplicação

1. Limpe o cache do navegador (Ctrl+Shift+Delete)
2. Recarregue a página (Ctrl+F5)
3. Verifique o console
4. Clique no avatar no header

**Deve aparecer:**
- Nome ou email
- Badge com o perfil (super_admin, admin, member, viewer)

---

## 📞 Ainda Não Funciona?

Se após todas as verificações o perfil ainda não carregar:

1. **Compartilhe os logs do console**
2. **Execute e compartilhe o resultado:**
   ```sql
   SELECT * FROM public.profiles WHERE email = 'seu@email.com';
   ```
3. **Verifique se há erros no Network tab** (F12 > Network)
4. **Tente criar um novo usuário** e veja se funciona

---

## ✅ Checklist Final

- [ ] Tabela `profiles` existe
- [ ] Trigger `on_auth_user_created` existe
- [ ] Seu usuário tem perfil na tabela
- [ ] Console mostra "✅ Perfil encontrado"
- [ ] AdminLayout mostra "Profile: { ... }"
- [ ] Header exibe nome e badge do perfil
