-- Script para testar se as políticas RLS estão funcionando corretamente
-- Execute este script no Supabase Dashboard > SQL Editor após aplicar a migration

-- 1. Verificar se a tabela profiles existe
SELECT 'Verificando tabela profiles...' as step;
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'profiles';

-- 2. Verificar se RLS está habilitado
SELECT 'Verificando RLS...' as step;
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'profiles';

-- 3. Listar todas as políticas da tabela profiles
SELECT 'Listando políticas...' as step;
SELECT 
  policyname,
  cmd as operation,
  roles,
  CASE 
    WHEN qual IS NOT NULL THEN 'USING: ' || qual
    ELSE 'No USING clause'
  END as using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check
    ELSE 'No WITH CHECK clause'
  END as with_check_clause
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY cmd, policyname;

-- 4. Contar políticas por operação
SELECT 'Contando políticas por operação...' as step;
SELECT 
  cmd as operation,
  COUNT(*) as policy_count
FROM pg_policies
WHERE tablename = 'profiles'
GROUP BY cmd
ORDER BY cmd;

-- 5. Verificar políticas de INSERT especificamente
SELECT 'Verificando políticas de INSERT...' as step;
SELECT 
  policyname,
  roles,
  with_check
FROM pg_policies
WHERE tablename = 'profiles' 
  AND cmd = 'INSERT';

-- 6. Verificar se o trigger existe
SELECT 'Verificando trigger handle_new_user...' as step;
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- 7. Verificar função do trigger
SELECT 'Verificando função handle_new_user...' as step;
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_name = 'handle_new_user';

-- 8. Resumo final
SELECT 'RESUMO FINAL' as step;

DO $$
DECLARE
  rls_enabled BOOLEAN;
  insert_policies INTEGER;
  select_policies INTEGER;
  update_policies INTEGER;
  trigger_exists BOOLEAN;
BEGIN
  -- Verificar RLS
  SELECT rowsecurity INTO rls_enabled
  FROM pg_tables
  WHERE tablename = 'profiles';
  
  -- Contar políticas
  SELECT COUNT(*) INTO insert_policies
  FROM pg_policies
  WHERE tablename = 'profiles' AND cmd = 'INSERT';
  
  SELECT COUNT(*) INTO select_policies
  FROM pg_policies
  WHERE tablename = 'profiles' AND cmd = 'SELECT';
  
  SELECT COUNT(*) INTO update_policies
  FROM pg_policies
  WHERE tablename = 'profiles' AND cmd = 'UPDATE';
  
  -- Verificar trigger
  SELECT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'on_auth_user_created'
  ) INTO trigger_exists;
  
  -- Exibir resumo
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RESUMO DA CONFIGURAÇÃO';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RLS Habilitado: %', CASE WHEN rls_enabled THEN '✅ SIM' ELSE '❌ NÃO' END;
  RAISE NOTICE 'Políticas INSERT: % %', insert_policies, CASE WHEN insert_policies >= 2 THEN '✅' ELSE '❌' END;
  RAISE NOTICE 'Políticas SELECT: % %', select_policies, CASE WHEN select_policies >= 3 THEN '✅' ELSE '⚠️' END;
  RAISE NOTICE 'Políticas UPDATE: % %', update_policies, CASE WHEN update_policies >= 1 THEN '✅' ELSE '⚠️' END;
  RAISE NOTICE 'Trigger Criação: %', CASE WHEN trigger_exists THEN '✅ SIM' ELSE '❌ NÃO' END;
  RAISE NOTICE '========================================';
  
  IF rls_enabled AND insert_policies >= 2 AND trigger_exists THEN
    RAISE NOTICE '✅ CONFIGURAÇÃO OK! O sistema deve funcionar corretamente.';
  ELSE
    RAISE WARNING '⚠️ CONFIGURAÇÃO INCOMPLETA! Verifique os itens marcados com ❌';
  END IF;
END $$;
