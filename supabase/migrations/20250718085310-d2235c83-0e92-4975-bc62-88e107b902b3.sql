-- Fix patients by assigning them to the hospital
-- This will make them visible in the appointment scheduling form

UPDATE public.patients 
SET hospital_id = '8d732749-1603-4bde-9752-dfa96f01f879'
WHERE hospital_id IS NULL;