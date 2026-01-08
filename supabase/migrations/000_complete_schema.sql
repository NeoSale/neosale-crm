-- =============================================================================
-- NeoSale CRM - Complete Database Schema
-- =============================================================================
-- Este script consolida todas as migrações em um único arquivo.
-- Pode ser executado em um banco novo ou existente (usa IF NOT EXISTS).
-- =============================================================================

-- =============================================================================
-- 1. EXTENSIONS
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- 2. TYPES (ENUMS)
-- =============================================================================
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'member', 'viewer');
  END IF;
END $$;

-- =============================================================================
-- 3. TABLES
-- =============================================================================

-- Profiles table (linked to auth.users)
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_cliente_id ON profiles(cliente_id);

-- =============================================================================
-- 4. HELPER FUNCTIONS (SECURITY DEFINER to bypass RLS)
-- =============================================================================

-- Function to get user role (bypasses RLS to avoid infinite recursion)
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Function to get user cliente_id (bypasses RLS to avoid infinite recursion)
CREATE OR REPLACE FUNCTION public.get_user_cliente_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT cliente_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 5. TRIGGERS
-- =============================================================================

-- Trigger for updated_at on profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Super admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view profiles in their clientes" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Super admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Users can view profiles in same cliente" ON profiles;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Policy: Users can view profiles in same cliente (includes super_admin access)
CREATE POLICY "Users can view profiles in same cliente"
  ON profiles FOR SELECT
  USING (
    auth.uid() = id
    OR cliente_id = public.get_user_cliente_id()
    OR public.get_user_role() = 'super_admin'
  );

-- Policy: Authenticated users can insert their own profile
CREATE POLICY "Enable insert for authenticated users"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policy: Super admins can insert any profile
CREATE POLICY "Super admins can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() = 'super_admin');

-- =============================================================================
-- 7. AUTH TRIGGER (handle_new_user)
-- =============================================================================

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_cliente_id UUID;
BEGIN
  -- 1. Get cliente_id from metadata (passed during signup)
  user_cliente_id := (NEW.raw_user_meta_data->>'cliente_id')::UUID;
  
  -- 2. If not specified, get the first available cliente
  IF user_cliente_id IS NULL THEN
    SELECT id INTO user_cliente_id 
    FROM public.clientes 
    ORDER BY created_at ASC 
    LIMIT 1;
  END IF;
  
  -- 3. Create user profile with cliente_id
  INSERT INTO public.profiles (id, email, full_name, avatar_url, cliente_id)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    user_cliente_id
  );
  
  IF user_cliente_id IS NOT NULL THEN
    RAISE NOTICE 'User % linked to cliente %', NEW.email, user_cliente_id;
  ELSE
    RAISE WARNING 'No cliente found to link user %', NEW.email;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- 8. DATA MIGRATION (for existing databases)
-- =============================================================================

-- Create profiles for existing users without one
INSERT INTO public.profiles (id, email, full_name, avatar_url, role, created_at, updated_at)
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'full_name' as full_name,
  u.raw_user_meta_data->>'avatar_url' as avatar_url,
  'viewer' as role,
  u.created_at,
  NOW() as updated_at
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Migrate cliente_id from cliente_members to profiles (if table exists)
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

-- =============================================================================
-- 9. CLEANUP (remove deprecated tables)
-- =============================================================================

-- Remove cliente_members table if exists (deprecated)
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
    RAISE NOTICE 'cliente_members table removed (deprecated)';
  END IF;
END $$;

-- =============================================================================
-- 10. SET SUPER ADMIN
-- =============================================================================

-- Set super_admin role for the main admin user
-- Note: The user must already exist in auth.users (created via signup or dashboard)
-- The profile is created automatically by the handle_new_user trigger
UPDATE profiles
SET role = 'super_admin'
WHERE email = 'neosaleai@gmail.com';

-- =============================================================================
-- DONE
-- =============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ NeoSale CRM schema migration completed successfully!';
END $$;
