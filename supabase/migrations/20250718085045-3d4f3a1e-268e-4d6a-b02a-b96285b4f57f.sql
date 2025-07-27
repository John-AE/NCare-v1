-- Fix the demo accounts by assigning them to a hospital
-- This will resolve the appointment scheduling and data visibility issues

-- Update all demo profiles to belong to the first hospital (General Hospital)
UPDATE public.profiles 
SET hospital_id = '8d732749-1603-4bde-9752-dfa96f01f879'
WHERE username IN ('nurse_demo', 'doctor_demo', 'finance_demo', 'admin@demo.com');

-- Also create a profile for the new admin account if it doesn't exist
INSERT INTO public.profiles (user_id, username, role, hospital_id)
SELECT 
  au.id,
  'johnnybgsu@gmail.com',
  'admin',
  '8d732749-1603-4bde-9752-dfa96f01f879'
FROM auth.users au
WHERE au.email = 'johnnybgsu@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = au.id
  );