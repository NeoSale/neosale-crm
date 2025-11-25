-- Migration: Auto-link user to cliente on signup
-- Atualiza o trigger handle_new_user para criar automaticamente
-- a vinculação do usuário com o cliente especificado no signup

-- Recriar a função handle_new_user com vinculação automática
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_cliente_id UUID;
BEGIN
  -- 1. Criar perfil do usuário
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  -- 2. Obter cliente_id do metadata (passado no signup)
  user_cliente_id := (NEW.raw_user_meta_data->>'cliente_id')::UUID;
  
  -- 3. Se não foi especificado, tentar pegar o primeiro cliente disponível
  IF user_cliente_id IS NULL THEN
    SELECT id INTO user_cliente_id 
    FROM public.clientes 
    ORDER BY created_at ASC 
    LIMIT 1;
  END IF;
  
  -- 4. Criar vinculação se encontrou um cliente
  IF user_cliente_id IS NOT NULL THEN
    INSERT INTO public.cliente_members (user_id, cliente_id, role)
    VALUES (NEW.id, user_cliente_id, 'viewer')
    ON CONFLICT (user_id, cliente_id) DO NOTHING;
    
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
  RAISE NOTICE 'Migration 006 executada: Trigger handle_new_user atualizado para vincular usuários automaticamente';
END $$;
