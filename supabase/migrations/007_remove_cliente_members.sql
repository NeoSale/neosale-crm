-- Migration: Remove cliente_members table and add cliente_id to profiles
-- Esta migration deve ser executada em bancos existentes para migrar de cliente_members para profiles.cliente_id

-- 0. Criar enum user_role (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'member', 'viewer');
  END IF;
END $$;

-- 0.1 Criar função get_user_role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- 1. Adicionar coluna cliente_id na tabela profiles (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'cliente_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_profiles_cliente_id ON profiles(cliente_id);
  END IF;
END $$;

-- 2. Migrar dados de cliente_members para profiles.cliente_id (se a tabela existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cliente_members') THEN
    UPDATE profiles p
    SET cliente_id = (
      SELECT cm.cliente_id 
      FROM cliente_members cm 
      WHERE cm.user_id = p.id 
      ORDER BY cm.created_at ASC 
      LIMIT 1
    )
    WHERE p.cliente_id IS NULL
    AND EXISTS (SELECT 1 FROM cliente_members cm WHERE cm.user_id = p.id);
  END IF;
END $$;

-- 3. Atualizar função get_user_cliente_id
CREATE OR REPLACE FUNCTION public.get_user_cliente_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT cliente_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- 4. Atualizar políticas de profiles para usar cliente_id diretamente
-- IMPORTANTE: Remover política problemática que causa recursão infinita
DROP POLICY IF EXISTS "Admins can view profiles in their clientes" ON profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON profiles;

-- Política simplificada: usuários podem ver profiles do mesmo cliente
-- Usa as funções SECURITY DEFINER que não passam por RLS
CREATE POLICY "Users can view profiles in same cliente"
  ON profiles FOR SELECT
  USING (
    -- Usuário pode ver seu próprio perfil
    auth.uid() = id
    OR
    -- Ou perfis do mesmo cliente (usando função que bypassa RLS)
    cliente_id = public.get_user_cliente_id()
    OR
    -- Super admin pode ver todos
    public.get_user_role() = 'super_admin'
  );

-- 5. Remover políticas e tabela cliente_members (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cliente_members') THEN
    DROP POLICY IF EXISTS "Users can view their own memberships" ON cliente_members;
    DROP POLICY IF EXISTS "Super admins can view all memberships" ON cliente_members;
    DROP POLICY IF EXISTS "Admins can view memberships in their clientes" ON cliente_members;
    DROP POLICY IF EXISTS "Admins can insert memberships in their clientes" ON cliente_members;
    DROP POLICY IF EXISTS "Admins can update memberships in their clientes" ON cliente_members;
    DROP POLICY IF EXISTS "Admins can delete memberships in their clientes" ON cliente_members;
    DROP POLICY IF EXISTS "Super admins can manage all memberships" ON cliente_members;
    DROP TRIGGER IF EXISTS update_cliente_members_updated_at ON cliente_members;
    DROP TABLE cliente_members;
  END IF;
END $$;

-- 8. Atualizar função handle_new_user para incluir cliente_id
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
  RAISE NOTICE 'Migration 007 executada: cliente_members removida, profiles.cliente_id adicionado';
END $$;
