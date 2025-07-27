-- Add medication_id column back to bill_items table
ALTER TABLE public.bill_items ADD COLUMN IF NOT EXISTS medication_id uuid REFERENCES public.medications(id);