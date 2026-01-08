-- Script para verificar e criar perfis para usuários existentes

-- 1. Verificar usuários sem perfil
SELECT 
  u.id,
  u.email,
  u.created_at,
  p.id as profile_id
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- 2. Criar perfis para usuários que não têm
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

-- 3. Verificar se todos os usuários têm perfil agora
SELECT 
  COUNT(*) as total_users,
  COUNT(p.id) as users_with_profile,
  COUNT(*) - COUNT(p.id) as users_without_profile
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id;

-- 4. Listar todos os perfis
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.created_at
FROM public.profiles p
ORDER BY p.created_at DESC;
