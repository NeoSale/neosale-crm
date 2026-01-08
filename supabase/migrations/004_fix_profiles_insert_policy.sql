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
