-- Fix infinite recursion in RLS policies
-- The problem: policies that check profiles.role cause infinite recursion
-- Solution: Use a custom claim in JWT or a simpler approach

-- Drop problematic policies
DROP POLICY IF EXISTS "Super admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view profiles in their clientes" ON profiles;
DROP POLICY IF EXISTS "Super admins can view all memberships" ON cliente_members;
DROP POLICY IF EXISTS "Admins can view memberships in their clientes" ON cliente_members;
DROP POLICY IF EXISTS "Super admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Super admins can insert memberships" ON cliente_members;
DROP POLICY IF EXISTS "Super admins can update memberships" ON cliente_members;
DROP POLICY IF EXISTS "Super admins can delete memberships" ON cliente_members;
DROP POLICY IF EXISTS "Admins can insert memberships in their clientes" ON cliente_members;
DROP POLICY IF EXISTS "Admins can update memberships in their clientes" ON cliente_members;
DROP POLICY IF EXISTS "Admins can delete memberships in their clientes" ON cliente_members;

-- Recreate profiles policies without recursion
-- Strategy: Use a function that caches the user's role to avoid recursion

-- Create a function to get user role (with caching to avoid recursion)
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Now recreate policies using the function
CREATE POLICY "Super admins can view all profiles"
  ON profiles FOR SELECT
  USING (public.get_user_role() = 'super_admin');

-- REMOVIDA: Esta política causa recursão porque consulta cliente_members
-- que também tem políticas que dependem de profiles

-- Cliente members policies
CREATE POLICY "Super admins can view all memberships"
  ON cliente_members FOR SELECT
  USING (public.get_user_role() = 'super_admin');

CREATE POLICY "Admins can view memberships in their clientes"
  ON cliente_members FOR SELECT
  USING (
    -- Simplificado: apenas verifica se o usuário tem membership no mesmo cliente
    -- Sem verificar role (evita recursão)
    EXISTS (
      SELECT 1 FROM cliente_members cm
      WHERE cm.user_id = auth.uid() 
        AND cm.cliente_id = cliente_members.cliente_id
    )
  );

-- Cliente Members: Políticas de INSERT/UPDATE/DELETE
CREATE POLICY "Super admins can manage all memberships"
  ON cliente_members FOR ALL
  USING (public.get_user_role() = 'super_admin')
  WITH CHECK (public.get_user_role() = 'super_admin');

-- Insert policy for profiles (super admins only)
CREATE POLICY "Super admins can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (public.get_user_role() = 'super_admin');
