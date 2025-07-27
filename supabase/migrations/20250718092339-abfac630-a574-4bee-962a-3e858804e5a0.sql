-- Update the get_current_user_hospital_id function to handle potential issues
CREATE OR REPLACE FUNCTION public.get_current_user_hospital_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT hospital_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
$$;