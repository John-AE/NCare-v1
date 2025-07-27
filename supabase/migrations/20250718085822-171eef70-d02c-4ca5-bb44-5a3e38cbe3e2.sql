-- Fix all existing data by assigning hospital_id to the General Hospital
-- This will make all financial data visible in the finance dashboard

-- Update all bills to belong to the hospital
UPDATE public.bills 
SET hospital_id = '8d732749-1603-4bde-9752-dfa96f01f879'
WHERE hospital_id IS NULL;

-- Update all visits to belong to the hospital  
UPDATE public.visits 
SET hospital_id = '8d732749-1603-4bde-9752-dfa96f01f879'
WHERE hospital_id IS NULL;

-- Update all vital signs to belong to the hospital
UPDATE public.vital_signs 
SET hospital_id = '8d732749-1603-4bde-9752-dfa96f01f879'
WHERE hospital_id IS NULL;

-- Update all services to belong to the hospital (if any exist without hospital_id)
UPDATE public.services 
SET hospital_id = '8d732749-1603-4bde-9752-dfa96f01f879'
WHERE hospital_id IS NULL;