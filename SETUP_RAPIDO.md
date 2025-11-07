# 🚀 Setup Rápido - NeoCRM com Super Admin

## ✅ Pré-requisitos

- ✅ Tabelas `clientes` e `perfis` já existem
- ✅ Supabase configurado
- ✅ Variáveis de ambiente configuradas

---

## 📋 Passo a Passo

### **1. Executar SQL Incremental** (5 minutos)

1. Acesse https://app.supabase.com
2. Vá em **SQL Editor**
3. Abra o arquivo `SUPABASE_DATABASE_INCREMENTAL.sql`
4. Copie TODO o conteúdo
5. Cole no SQL Editor
6. Clique em **Run**

**O que este SQL faz:**
- ✅ Adiciona colunas novas em `usuarios` e `clientes` (sem recriar)
- ✅ Cria tabela `usuario_clientes` (relacionamento N:N)
- ✅ Cria tabela `tipos_acesso`
- ✅ Adiciona índices para performance
- ✅ Configura RLS (Row Level Security)
- ✅ Cria triggers automáticos
- ✅ Insere perfis e tipos de acesso padrão
- ✅ Cria view `vw_usuarios_completos`

### **2. Verificar Variáveis de Ambiente**

Confirme que `.env.local` tem:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### **3. Criar Primeiro Super Admin**

**Opção A: Via Página /setup (Mais Fácil)**

```bash
# 1. Rodar aplicação
npm run dev

# 2. Acessar
http://localhost:3000/setup

# 3. Preencher formulário
- Nome: Seu Nome
- Email: admin@neosaleai.com
- Senha: Admin@123456 (troque depois!)
- Cliente: (opcional)

# 4. Clicar em "Concluir Setup"
```

**Opção B: Via Supabase Dashboard (Manual)**

1. **Authentication → Users → Add User**
   - Email: `admin@neosaleai.com`
   - Password: `Admin@123456`
   - Auto Confirm User: ✅ Sim

2. **Copiar o ID do usuário criado**

3. **SQL Editor → Executar:**
```sql
-- Atualizar tipo de usuário para super_admin
UPDATE usuarios 
SET tipo_usuario = 'super_admin'
WHERE email = 'admin@neosaleai.com';
```

### **4. Testar Login**

1. Acesse `http://localhost:3000/login`
2. Login: `admin@neosaleai.com`
3. Senha: `Admin@123456`
4. Deve entrar no sistema ✅

---

## 🔍 Verificações

### **Verificar se tabelas foram criadas:**

```sql
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('usuarios', 'clientes', 'perfis', 'usuario_clientes', 'tipos_acesso')
ORDER BY tablename;
```

**Resultado esperado:**
- clientes
- perfis
- tipos_acesso
- usuario_clientes
- usuarios

### **Verificar se Super Admin foi criado:**

```sql
SELECT id, nome, email, tipo_usuario, ativo 
FROM usuarios 
WHERE tipo_usuario = 'super_admin';
```

**Resultado esperado:**
- 1 linha com seu Super Admin

### **Verificar perfis do sistema:**

```sql
SELECT id, nome, is_sistema 
FROM perfis 
WHERE is_sistema = true;
```

**Resultado esperado:**
- Super Admin
- Admin Cliente
- Usuário Padrão

---

## 🎯 Próximos Passos

### **1. Convidar Usuários**

```
http://localhost:3000/convites
```

- Preencha email
- Adicione nome (opcional)
- Envie convite
- Usuário receberá email do Supabase

### **2. Criar Clientes**

Via API ou interface (a ser implementada):

```typescript
POST /api/clientes
{
  "nome": "Cliente Teste",
  "razao_social": "Cliente Teste Ltda",
  "cnpj": "00.000.000/0000-00"
}
```

### **3. Vincular Usuário a Cliente**

```sql
INSERT INTO usuario_clientes (usuario_id, cliente_id, perfil_id, is_principal)
VALUES (
  'uuid-do-usuario',
  'uuid-do-cliente',
  'a0000000-0000-0000-0000-000000000002', -- Admin Cliente
  true
);
```

---

## 🆘 Troubleshooting

### **Erro: "column tipo_usuario does not exist"**

Execute o SQL incremental novamente. A coluna deve ser adicionada automaticamente.

### **Erro: "relation usuario_clientes does not exist"**

A tabela não foi criada. Execute o SQL incremental.

### **Erro: "permission denied for table usuarios"**

RLS está bloqueando. Verifique se as políticas foram criadas:

```sql
SELECT * FROM pg_policies WHERE tablename = 'usuarios';
```

### **Super Admin não vê todos os clientes**

Verifique o tipo de usuário:

```sql
SELECT tipo_usuario FROM usuarios WHERE email = 'admin@neosaleai.com';
```

Deve retornar `super_admin`. Se não, execute:

```sql
UPDATE usuarios 
SET tipo_usuario = 'super_admin'
WHERE email = 'admin@neosaleai.com';
```

---

## 📊 Estrutura Final

```
usuarios
  ├─ id
  ├─ auth_user_id (link com auth.users)
  ├─ tipo_usuario (super_admin, admin, usuario)
  ├─ nome, email, telefone
  └─ ativo, email_verificado

usuario_clientes (N:N)
  ├─ usuario_id → usuarios
  ├─ cliente_id → clientes
  ├─ perfil_id → perfis
  └─ is_principal

clientes
  ├─ id
  ├─ nome, razao_social, cnpj
  └─ ativo

perfis
  ├─ id
  ├─ nome, permissoes (JSON)
  └─ is_sistema
```

---

## ✅ Checklist

- [ ] SQL incremental executado
- [ ] Variáveis de ambiente configuradas
- [ ] Super Admin criado
- [ ] Login testado
- [ ] Sistema funcionando

---

## 📚 Documentação Completa

- **`SUPABASE_DATABASE_SETUP.md`** - Documentação completa do banco
- **`SUPABASE_INVITE_SETUP.md`** - Sistema de convites
- **`SUPABASE_DATABASE_INCREMENTAL.sql`** - SQL para executar

---

**Tempo estimado: 10 minutos** ⏱️
