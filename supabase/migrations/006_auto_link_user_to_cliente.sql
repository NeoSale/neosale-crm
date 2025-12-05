-- Migration: Auto-link user to cliente on signup
-- Atualiza o trigger handle_new_user para criar automaticamente
-- o perfil do usuário com o cliente_id especificado no signup

-- Recriar a função handle_new_user com cliente_id no profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_cliente_id UUID;
BEGIN
  -- 1. Obter cliente_id do metadata (passado no signup)
  user_cliente_id := (NEW.raw_user_meta_data->>'cliente_id')::UUID;
  
  -- 2. Se não foi especificado, tentar pegar o primeiro cliente disponível
  IF user_cliente_id IS NULL THEN
    SELECT id INTO user_cliente_id 
    FROM public.clientes 
    ORDER BY created_at ASC 
    LIMIT 1;
  END IF;
  
  -- 3. Criar perfil do usuário com cliente_id
  INSERT INTO public.profiles (id, email, full_name, avatar_url, cliente_id)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    user_cliente_id
  );
  
  IF user_cliente_id IS NOT NULL THEN
    RAISE NOTICE 'Usuário % vinculado ao cliente %', NEW.email, user_cliente_id;
  ELSE
    RAISE WARNING 'Nenhum cliente encontrado para vincular o usuário %', NEW.email;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE 'Migration 006 executada: Trigger handle_new_user atualizado para vincular usuários automaticamente via profiles.cliente_id';
END $$;
