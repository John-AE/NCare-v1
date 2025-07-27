
-- Create sample hospitals
INSERT INTO public.hospitals (name, address, phone, email, is_active) VALUES
('General Hospital', '123 Main Street, City Center, State 12345', '+1-555-0101', 'info@generalhospital.com', true),
('City Medical Center', '456 Oak Avenue, Downtown, State 67890', '+1-555-0202', 'contact@citymedical.com', true);

-- Create admin user account
-- First, we need to insert into auth.users (this would normally be done through Supabase Auth API)
-- Since we can't directly insert into auth.users via SQL, we'll create the profile entry
-- The actual auth user creation will need to be done through the application

-- For now, let's update the existing demo users to have hospital assignments
-- Get the hospital IDs first and assign them to existing demo accounts
UPDATE public.profiles 
SET hospital_id = (SELECT id FROM public.hospitals WHERE name = 'General Hospital' LIMIT 1)
WHERE username IN ('nurse@demo.com', 'doctor@demo.com');

UPDATE public.profiles 
SET hospital_id = (SELECT id FROM public.hospitals WHERE name = 'City Medical Center' LIMIT 1)
WHERE username = 'finance@demo.com';

-- Note: The admin account will be created through the signup process in the application
-- since we cannot directly insert into auth.users via SQL migration
