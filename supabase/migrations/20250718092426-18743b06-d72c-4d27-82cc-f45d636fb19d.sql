-- Fix all existing services without hospital_id and update the services RLS policy to be clearer
UPDATE public.services 
SET hospital_id = '8d732749-1603-4bde-9752-dfa96f01f879'
WHERE hospital_id IS NULL;