-- Add foreign key constraint between bills and patients tables
ALTER TABLE public.bills 
ADD CONSTRAINT bills_patient_id_fkey 
FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;