-- Fix infinite recursion in RLS policies
-- The problem: policies that check profiles.role cause infinite recursion
-- Solution: Use a custom claim in JWT or a simpler approach

-- Drop problematic policies
DROP POLICY IF EXISTS "Super admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view profiles in their clientes" ON profiles;
DROP POLICY IF EXISTS "Super admins can insert profiles" ON profiles;

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

-- Create a function to get user cliente_id
CREATE OR REPLACE FUNCTION public.get_user_cliente_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT cliente_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Now recreate policies using the function
CREATE POLICY "Super admins can view all profiles"
  ON profiles FOR SELECT
  USING (public.get_user_role() = 'super_admin');

-- Admins can view profiles in their cliente
CREATE POLICY "Admins can view profiles in their clientes"
  ON profiles FOR SELECT
  USING (
    public.get_user_role() IN ('admin', 'super_admin')
    AND profiles.cliente_id = public.get_user_cliente_id()
  );

-- Insert policy for profiles (super admins only)
CREATE POLICY "Super admins can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (public.get_user_role() = 'super_admin');
