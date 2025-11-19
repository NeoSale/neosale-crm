# 🔧 Como Resolver: Trigger já existe

## ❌ Erro

```
ERROR: 42710: trigger "on_auth_user_created" for relation "users" already exists
```

## 🔍 Causa

Você tentou executar a migration `001_auth_schema.sql` mais de uma vez, e o trigger já existe no banco de dados.

---

## ✅ Solução 1: Usar Migration Segura (Recomendado)

Use o arquivo **`001_auth_schema_safe.sql`** que verifica se os objetos já existem antes de criá-los.

### Passo a Passo:

1. **Abra o Supabase Dashboard** > **SQL Editor**

2. **Cole o conteúdo de:**
   ```
   supabase/migrations/001_auth_schema_safe.sql
   ```

3. **Execute** (clique em "Run")

4. **Resultado esperado:**
   ```
   NOTICE: Migration executada com sucesso!
   Success. No rows returned
   ```

✅ Pronto! A migration foi aplicada sem erros.

---

## ✅ Solução 2: Limpar e Recomeçar

⚠️ **ATENÇÃO:** Isso vai deletar TODOS os dados das tabelas `profiles` e `cliente_members`!

Use esta opção apenas se:
- Você está em desenvolvimento
- Não tem dados importantes
- Quer recomeçar do zero

### Passo a Passo:

1. **Abra o Supabase Dashboard** > **SQL Editor**

2. **Execute primeiro:**
   ```
   supabase/migrations/000_cleanup.sql
   ```
   Isso vai remover todas as tabelas, triggers e policies.

3. **Depois execute:**
   ```
   supabase/migrations/001_auth_schema.sql
   ```
   (O arquivo original que você já tem)

---

## ✅ Solução 3: Remover Apenas o Trigger

Se você quer manter os dados e apenas recriar o trigger:

```sql
-- Remover o trigger existente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recriar o trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## 📋 Arquivos Criados

### `000_cleanup.sql`
- Remove TODOS os objetos da migration
- Use apenas se quiser recomeçar do zero
- ⚠️ DELETA TODOS OS DADOS!

### `001_auth_schema_safe.sql`
- Versão segura da migration original
- Verifica se objetos já existem antes de criar
- Pode ser executada múltiplas vezes sem erro
- ✅ **Recomendado para uso**

### `001_auth_schema.sql`
- Migration original (já existe)
- Pode dar erro se executada mais de uma vez
- Use apenas em banco de dados limpo

---

## 🎯 Qual Usar?

### Situação 1: Primeira vez executando
- ✅ Use: `001_auth_schema.sql` (original)

### Situação 2: Já executou antes e deu erro
- ✅ Use: `001_auth_schema_safe.sql` (seguro)

### Situação 3: Quer recomeçar do zero
1. Execute: `000_cleanup.sql`
2. Execute: `001_auth_schema.sql`

---

## 🔍 Como Verificar se a Migration Foi Aplicada

Execute no **SQL Editor**:

```sql
-- Verificar se as tabelas existem
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'cliente_members');

-- Verificar se o trigger existe
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Verificar se o tipo user_role existe
SELECT typname 
FROM pg_type 
WHERE typname = 'user_role';
```

**Resultado esperado:**
```
table_name
-----------------
profiles
cliente_members

trigger_name           | event_object_table
-----------------------|-------------------
on_auth_user_created   | users

typname
----------
user_role
```

---

## 🐛 Outros Erros Comuns

### Erro: "relation clientes does not exist"
**Causa:** A tabela `clientes` não existe no banco de dados.

**Solução:** 
1. Verifique se você tem a migration que cria a tabela `clientes`
2. Execute essa migration primeiro
3. Depois execute a migration de auth

### Erro: "type user_role already exists"
**Causa:** O tipo enum já foi criado.

**Solução:** Use `001_auth_schema_safe.sql` que trata isso automaticamente.

### Erro: "policy already exists"
**Causa:** As policies já foram criadas.

**Solução:** Use `001_auth_schema_safe.sql` que remove as policies antes de recriar.

---

## 📝 Comandos Úteis

### Ver todas as tabelas
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

### Ver todos os triggers
```sql
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public';
```

### Ver todas as policies
```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public';
```

### Ver todos os tipos enum
```sql
SELECT typname 
FROM pg_type 
WHERE typtype = 'e';
```

---

## 🚀 Próximos Passos

Após resolver o erro:

1. ✅ Verifique se as tabelas foram criadas
2. ✅ Execute a migration `002_create_super_admin.sql`
3. ✅ Crie o usuário super admin no Supabase Auth
4. ✅ Teste o login

---

## 💡 Dica

Para evitar esse erro no futuro:
- ✅ Use sempre `001_auth_schema_safe.sql`
- ✅ Documente quando executar migrations
- ✅ Use versionamento de migrations (Supabase CLI)
- ✅ Teste em ambiente de desenvolvimento primeiro
