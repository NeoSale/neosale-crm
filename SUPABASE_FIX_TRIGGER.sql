-- ============================================
-- FIX: Remover trigger problemático e recriar
-- ============================================

BEGIN;

-- 1. REMOVER TRIGGER ANTIGO
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- 2. VERIFICAR SE TABELA USUARIOS EXISTE
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'usuarios') THEN
    RAISE EXCEPTION 'Tabela usuarios não existe. Execute SUPABASE_DATABASE_INCREMENTAL.sql primeiro!';
  END IF;
END $$;

-- 3. CRIAR FUNÇÃO SIMPLIFICADA (sem HTTP requests)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir usuário na tabela usuarios
  INSERT INTO public.usuarios (
    auth_user_id,
    nome,
    email,
    tipo_usuario,
    email_verificado,
    ativo
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'tipo_usuario', 'usuario'),
    CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN true ELSE false END,
    true
  )
  ON CONFLICT (auth_user_id) DO UPDATE SET
    email = EXCLUDED.email,
    email_verificado = EXCLUDED.email_verificado;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log do erro mas não falha o signup
    RAISE WARNING 'Erro ao criar registro em usuarios: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RECRIAR TRIGGER
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- 5. VERIFICAR AUTH HOOKS NO SUPABASE
-- IMPORTANTE: Vá em Authentication → Hooks no Dashboard
-- e DESABILITE qualquer hook que esteja configurado

COMMIT;

-- Verificação
SELECT 'Trigger recriado com sucesso!' as status;

-- Testar se trigger existe
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
