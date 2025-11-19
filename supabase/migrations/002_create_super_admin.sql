-- This migration creates the super admin user
-- Note: You need to manually create the user in Supabase Auth first with email: neosaleai@gmail.com
-- Then run this migration to set the role to super_admin

-- Update the profile role to super_admin for neosaleai@gmail.com
UPDATE profiles
SET role = 'super_admin'
WHERE email = 'neosaleai@gmail.com';

-- If the profile doesn't exist yet, this function will be called when the user signs up
-- The trigger will create the profile, then you can manually update the role
