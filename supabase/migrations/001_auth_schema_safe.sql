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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cliente_members table (many-to-many relationship between users and clientes)
CREATE TABLE IF NOT EXISTS cliente_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE NOT NULL,
  role user_role DEFAULT 'viewer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, cliente_id)
);

-- Create indexes (IF NOT EXISTS disponível no PostgreSQL 9.5+)
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_cliente_members_user_id ON cliente_members(user_id);
CREATE INDEX IF NOT EXISTS idx_cliente_members_cliente_id ON cliente_members(cliente_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cliente_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies before recreating
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view profiles in their clientes" ON profiles;

DROP POLICY IF EXISTS "Users can view their own memberships" ON cliente_members;
DROP POLICY IF EXISTS "Super admins can view all memberships" ON cliente_members;
DROP POLICY IF EXISTS "Admins can view memberships in their clientes" ON cliente_members;
DROP POLICY IF EXISTS "Admins can insert memberships in their clientes" ON cliente_members;
DROP POLICY IF EXISTS "Admins can update memberships in their clientes" ON cliente_members;
DROP POLICY IF EXISTS "Admins can delete memberships in their clientes" ON cliente_members;

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
      SELECT 1 FROM cliente_members cm1
      INNER JOIN cliente_members cm2 ON cm1.cliente_id = cm2.cliente_id
      WHERE cm1.user_id = auth.uid() 
        AND cm1.role IN ('admin', 'super_admin')
        AND cm2.user_id = profiles.id
    )
  );

-- Cliente members policies
CREATE POLICY "Users can view their own memberships"
  ON cliente_members FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Super admins can view all memberships"
  ON cliente_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "Admins can view memberships in their clientes"
  ON cliente_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cliente_members
      WHERE user_id = auth.uid() 
        AND cliente_id = cliente_members.cliente_id
        AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can insert memberships in their clientes"
  ON cliente_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM cliente_members
      WHERE user_id = auth.uid() 
        AND cliente_id = cliente_members.cliente_id
        AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can update memberships in their clientes"
  ON cliente_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM cliente_members cm
      WHERE cm.user_id = auth.uid() 
        AND cm.cliente_id = cliente_members.cliente_id
        AND cm.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can delete memberships in their clientes"
  ON cliente_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM cliente_members cm
      WHERE cm.user_id = auth.uid() 
        AND cm.cliente_id = cliente_members.cliente_id
        AND cm.role IN ('admin', 'super_admin')
    )
  );

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
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
DROP TRIGGER IF EXISTS update_cliente_members_updated_at ON cliente_members;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cliente_members_updated_at
  BEFORE UPDATE ON cliente_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE 'Migration executada com sucesso!';
END $$;
