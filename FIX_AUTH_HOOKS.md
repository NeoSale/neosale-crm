# 🔧 Correção: Erro ao Criar Usuário no Supabase

## ❌ Problema

Erro ao tentar criar usuário via Dashboard do Supabase:
```
Failed to invite user: Failed to make POST request to "https://xxx"
Check your project's Auth logs for more information
Database error saving new user
```

**Causa:** Auth Hooks do Supabase tentando fazer requisições HTTP que falham.

---

## ✅ Solução Implementada

Criamos **2 soluções alternativas** que não dependem de triggers problemáticos:

### **Solução 1: API Route `/api/auth/signup`** ⭐ Recomendada

Cria usuário no Supabase Auth E na tabela `usuarios` em uma única chamada.

### **Solução 2: Trigger Simplificado**

Versão do trigger sem requisições HTTP.

---

## 🚀 Como Corrigir

### **Passo 1: Desabilitar Auth Hooks**

1. Acesse https://app.supabase.com
2. Vá em **Authentication → Hooks**
3. Se houver hooks configurados, **DELETE** todos
4. Salve

### **Passo 2: Executar SQL de Correção**

1. Vá em **SQL Editor**
2. Copie o conteúdo de `SUPABASE_FIX_TRIGGER.sql`
3. Execute

Isso vai:
- ✅ Remover trigger problemático
- ✅ Criar trigger simplificado (sem HTTP)
- ✅ Adicionar tratamento de erros

### **Passo 3: Criar Super Admin**

**Opção A: Via Página /setup (Mais Fácil)** ⭐

```bash
# 1. Rodar aplicação
npm run dev

# 2. Acessar
http://localhost:3000/setup

# 3. Preencher formulário
Nome: Admin
Email: admin@neosaleai.com
Senha: Admin@123456

# 4. Clicar em "Concluir Setup"
```

A página agora usa a API `/api/auth/signup` que:
- ✅ Cria usuário no Supabase Auth
- ✅ Cria registro na tabela `usuarios`
- ✅ Faz login automático
- ✅ Cria primeiro cliente (opcional)

**Opção B: Via API Diretamente**

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@neosaleai.com",
    "password": "Admin@123456",
    "nome": "Super Admin",
    "tipo_usuario": "super_admin"
  }'
```

**Opção C: Via SQL Manual**

```sql
-- 1. Criar no auth.users via Dashboard
-- Authentication → Users → Add User
-- (Pode dar erro, mas tente)

-- 2. Se der erro, execute este SQL:
-- Inserir diretamente no auth.users (requer service_role)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@neosaleai.com',
  crypt('Admin@123456', gen_salt('bf')),
  NOW(),
  '{"nome": "Super Admin", "tipo_usuario": "super_admin"}'::jsonb,
  NOW(),
  NOW()
)
RETURNING id;

-- 3. Copie o ID retornado e execute:
INSERT INTO usuarios (
  auth_user_id,
  nome,
  email,
  tipo_usuario,
  ativo,
  email_verificado
) VALUES (
  'COLE_O_ID_AQUI',
  'Super Admin',
  'admin@neosaleai.com',
  'super_admin',
  true,
  true
);
```

---

## 🧪 Testar

### **1. Testar Login**

```
http://localhost:3000/login
Email: admin@neosaleai.com
Senha: Admin@123456
```

### **2. Verificar Usuário no Banco**

```sql
-- Ver usuário criado
SELECT 
  u.id,
  u.nome,
  u.email,
  u.tipo_usuario,
  u.ativo,
  au.email as auth_email,
  au.email_confirmed_at
FROM usuarios u
JOIN auth.users au ON au.id = u.auth_user_id
WHERE u.email = 'admin@neosaleai.com';
```

Deve retornar:
- ✅ 1 linha
- ✅ `tipo_usuario` = `super_admin`
- ✅ `ativo` = `true`
- ✅ `email_confirmed_at` preenchido

---

## 📊 Arquivos Criados

### **1. `/api/auth/signup/route.ts`**
API para criar usuários sem depender de triggers.

**Uso:**
```typescript
POST /api/auth/signup
{
  "email": "usuario@exemplo.com",
  "password": "senha123",
  "nome": "Nome do Usuário",
  "tipo_usuario": "usuario" // ou "admin" ou "super_admin"
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Usuário criado com sucesso",
  "data": {
    "id": "uuid",
    "auth_user_id": "uuid",
    "email": "usuario@exemplo.com",
    "nome": "Nome do Usuário",
    "tipo_usuario": "usuario"
  }
}
```

### **2. `SUPABASE_FIX_TRIGGER.sql`**
SQL para corrigir o trigger problemático.

### **3. `/setup/page.tsx` (Atualizado)**
Agora usa a API `/api/auth/signup` ao invés do trigger.

---

## 🔍 Diagnóstico

### **Verificar se Auth Hooks estão causando problema:**

1. **Authentication → Hooks**
2. Se houver hooks, DELETE
3. Tente criar usuário novamente

### **Verificar logs de erro:**

1. **Authentication → Logs**
2. Procure por erros relacionados a hooks
3. Se ver "Failed to make POST request", é o hook

### **Verificar se trigger existe:**

```sql
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

---

## 💡 Por Que Isso Acontece?

O Supabase tem 2 sistemas para executar código após criar usuário:

1. **Database Triggers** (PostgreSQL) - Roda no banco
2. **Auth Hooks** (HTTP) - Faz requisições HTTP

O erro acontece quando:
- ✅ Auth Hook está configurado mas a URL não responde
- ✅ Database Trigger tenta fazer requisições HTTP (não permitido)
- ✅ Trigger tem erro de sintaxe ou referência

**Nossa solução:**
- ❌ Não usar Auth Hooks
- ✅ Usar API Route que controla todo o processo
- ✅ Trigger simplificado apenas para casos automáticos

---

## 🎯 Vantagens da Nova Solução

| Aspecto | Trigger | API Route |
|---------|---------|-----------|
| **Confiabilidade** | ⚠️ Pode falhar | ✅ Controle total |
| **Erro handling** | ❌ Difícil debug | ✅ Try/catch |
| **Rollback** | ⚠️ Parcial | ✅ Completo |
| **Logs** | ⚠️ No banco | ✅ No servidor |
| **Flexibilidade** | ❌ Limitado | ✅ Total |

---

## ✅ Checklist de Correção

- [ ] Desabilitar Auth Hooks no Dashboard
- [ ] Executar `SUPABASE_FIX_TRIGGER.sql`
- [ ] Testar criar usuário via `/setup`
- [ ] Verificar login funciona
- [ ] Confirmar usuário está em `usuarios` e `auth.users`

---

## 🆘 Se Ainda Não Funcionar

### **Opção 1: Desabilitar Trigger Completamente**

```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
```

E use APENAS a API `/api/auth/signup` para criar usuários.

### **Opção 2: Criar Manualmente**

```sql
-- Para cada novo usuário, execute:
INSERT INTO usuarios (auth_user_id, nome, email, tipo_usuario, ativo, email_verificado)
SELECT id, split_part(email, '@', 1), email, 'usuario', true, true
FROM auth.users
WHERE email = 'email@exemplo.com'
ON CONFLICT (auth_user_id) DO NOTHING;
```

---

**Problema resolvido!** Use a página `/setup` ou a API `/api/auth/signup`. 🚀
