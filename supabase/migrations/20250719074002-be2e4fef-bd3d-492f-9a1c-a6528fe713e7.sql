-- Add complaints field to vital_signs table
ALTER TABLE public.vital_signs 
ADD COLUMN complaints TEXT;