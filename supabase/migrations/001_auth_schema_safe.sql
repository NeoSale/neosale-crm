-- Migration segura que verifica se os objetos já existem
-- Use este arquivo ao invés do 001_auth_schema.sql se você já executou a migration antes

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for user roles (DROP IF EXISTS não funciona com ENUM, então usamos DO)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'member', 'viewer');
  END IF;
END $$;

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'viewer',
  cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes (IF NOT EXISTS disponível no PostgreSQL 9.5+)
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_cliente_id ON profiles(cliente_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before recreating
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view profiles in their clientes" ON profiles;


-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Super admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "Admins can view profiles in their clientes"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() 
        AND p.role IN ('admin', 'super_admin')
        AND p.cliente_id = profiles.cliente_id
    )
  );

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_cliente_id UUID;
BEGIN
  -- Obter cliente_id do metadata (passado no signup)
  user_cliente_id := (NEW.raw_user_meta_data->>'cliente_id')::UUID;
  
  -- Se não foi especificado, tentar pegar o primeiro cliente disponível
  IF user_cliente_id IS NULL THEN
    SELECT id INTO user_cliente_id 
    FROM public.clientes 
    ORDER BY created_at ASC 
    LIMIT 1;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, avatar_url, cliente_id)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    user_cliente_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger before recreating
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop triggers before recreating
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE 'Migration executada com sucesso!';
END $$;
