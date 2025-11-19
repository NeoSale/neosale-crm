# Como Aplicar a Migration via Supabase Dashboard

Como o comando `psql` não está disponível no Windows, siga estes passos para aplicar a migration manualmente.

## 🚀 Acesso Rápido

**Link direto:** https://supabase.com/dashboard/project/_/sql

(Substitua `_` pelo ID do seu projeto)

---

## Passo 1: Acessar o Supabase Dashboard

1. Acesse: https://supabase.com/dashboard
2. Faça login na sua conta
3. Selecione o projeto **NeoSale CRM**
4. No menu lateral, clique em **SQL Editor**

## Passo 2: Abrir o SQL Editor

1. No menu lateral, clique em **SQL Editor**
2. Clique em **New Query** (ou use Ctrl+Enter)

## Passo 3: Copiar e Colar a Migration

Copie TODO o conteúdo abaixo e cole no SQL Editor:

```sql
-- Adicionar política para permitir inserção de perfis
-- Isso permite que o trigger handle_new_user funcione corretamente
-- e também permite que usuários criem seus próprios perfis se necessário

-- Drop políticas existentes se houver
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Super admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;

-- Permitir que usuários autenticados insiram seus próprios perfis
-- Esta política permite tanto o trigger quanto a criação manual
CREATE POLICY "Enable insert for authenticated users"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Permitir que super admins insiram perfis de outros usuários
CREATE POLICY "Super admins can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Garantir que o RLS está habilitado
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Verificar políticas criadas
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'profiles' AND cmd = 'INSERT';
  
  RAISE NOTICE 'Total de políticas INSERT para profiles: %', policy_count;
  
  IF policy_count >= 2 THEN
    RAISE NOTICE '✅ Políticas de INSERT para profiles criadas com sucesso!';
  ELSE
    RAISE WARNING '⚠️ Algumas políticas podem não ter sido criadas. Verifique manualmente.';
  END IF;
END $$;
```

## Passo 4: Executar a Migration

1. Clique no botão **Run** (ou pressione Ctrl+Enter)
2. Aguarde a execução
3. Verifique se aparece a mensagem: `✅ Políticas de INSERT para profiles criadas com sucesso!`

## Passo 5: Verificar as Políticas

Para confirmar que as políticas foram criadas:

1. No SQL Editor, execute esta query:

```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;
```

2. Você deve ver pelo menos **2 políticas de INSERT**:
   - `Enable insert for authenticated users`
   - `Super admins can insert profiles`

## Passo 6: Testar

1. Faça logout da aplicação
2. Faça login novamente
3. Verifique no console do navegador (F12) se aparece:
   - `✅ Perfil encontrado:` OU
   - `✅ Perfil criado:`

## Troubleshooting

### Se aparecer erro "permission denied"

Execute este comando para verificar se você tem permissões:

```sql
SELECT current_user, current_database();
```

Você deve estar conectado como `postgres` ou ter role de admin.

### Se as políticas não forem criadas

Tente criar manualmente uma por vez:

```sql
-- Política 1
CREATE POLICY "Enable insert for authenticated users"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Aguarde 2 segundos

-- Política 2
CREATE POLICY "Super admins can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );
```

### Se o erro persistir

Verifique se a tabela `profiles` existe:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'profiles';
```

Se não existir, execute primeiro a migration `001_auth_schema_safe.sql`.

## Alternativa: Desabilitar RLS Temporariamente (NÃO RECOMENDADO EM PRODUÇÃO)

**⚠️ APENAS PARA DESENVOLVIMENTO/TESTE:**

```sql
-- Desabilitar RLS temporariamente
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Testar se funciona
-- ...

-- IMPORTANTE: Reabilitar depois!
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

## Próximos Passos

Após aplicar com sucesso:

1. ✅ Teste criar um novo usuário
2. ✅ Teste fazer login com usuário existente
3. ✅ Verifique os logs do console
4. ✅ Confirme que não há mais erros 401/403

## Suporte

Se ainda houver problemas, verifique:
- Logs do Supabase Dashboard (Database > Logs)
- Console do navegador (F12 > Console)
- Network tab (F12 > Network) para ver as requisições
