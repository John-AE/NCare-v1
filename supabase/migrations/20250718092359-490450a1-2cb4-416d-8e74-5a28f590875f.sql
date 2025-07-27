-- Update the visits RLS policy to be more explicit and debug-friendly
DROP POLICY IF EXISTS "Doctors can create visits in their hospital" ON public.visits;

CREATE POLICY "Doctors can create visits in their hospital" 
ON public.visits 
FOR INSERT 
WITH CHECK (
  auth.uid() = doctor_id 
  AND hospital_id IS NOT NULL 
  AND hospital_id = (SELECT hospital_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('doctor', 'admin')
  )
);