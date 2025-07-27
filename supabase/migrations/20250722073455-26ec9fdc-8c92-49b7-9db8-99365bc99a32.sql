-- Add pharmacy role to existing user and update profiles table to support pharmacy role
UPDATE profiles 
SET role = 'pharmacy' 
WHERE username = 'pharmacy@demo.com';

-- Create medications table for inventory management
CREATE TABLE public.medications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  form TEXT NOT NULL, -- tablet, capsule, injection, syrup, etc.
  manufacturer TEXT NOT NULL,
  description TEXT,
  generic_name TEXT,
  category TEXT NOT NULL, -- antibiotics, painkillers, vitamins, etc.
  is_active BOOLEAN NOT NULL DEFAULT true,
  hospital_id UUID REFERENCES hospitals(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create medication_inventory table for stock management
CREATE TABLE public.medication_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE CASCADE,
  batch_number TEXT NOT NULL,
  expiry_date DATE NOT NULL,
  quantity_on_hand INTEGER NOT NULL DEFAULT 0,
  quantity_received INTEGER NOT NULL DEFAULT 0,
  unit_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  supplier TEXT,
  received_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reorder_point INTEGER NOT NULL DEFAULT 10,
  hospital_id UUID REFERENCES hospitals(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create medication_dispensing table for tracking dispensed medications
CREATE TABLE public.medication_dispensing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  medication_id UUID NOT NULL REFERENCES medications(id),
  patient_id UUID NOT NULL REFERENCES patients(id),
  visit_id UUID REFERENCES visits(id),
  inventory_id UUID NOT NULL REFERENCES medication_inventory(id),
  quantity_dispensed INTEGER NOT NULL,
  dispensed_by UUID NOT NULL, -- pharmacy staff user_id
  dispensed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  hospital_id UUID REFERENCES hospitals(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_dispensing ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for medications
CREATE POLICY "Users can view medications in their hospital" 
ON public.medications 
FOR SELECT 
USING ((hospital_id = get_current_user_hospital_id()) OR is_admin());

CREATE POLICY "Pharmacy and admin can manage medications" 
ON public.medications 
FOR ALL 
USING (((hospital_id = get_current_user_hospital_id()) OR is_admin()) AND (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = ANY (ARRAY['pharmacy'::text, 'admin'::text]))))));

-- Create RLS policies for medication_inventory
CREATE POLICY "Users can view inventory in their hospital" 
ON public.medication_inventory 
FOR SELECT 
USING ((hospital_id = get_current_user_hospital_id()) OR is_admin());

CREATE POLICY "Pharmacy and admin can manage inventory" 
ON public.medication_inventory 
FOR ALL 
USING (((hospital_id = get_current_user_hospital_id()) OR is_admin()) AND (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = ANY (ARRAY['pharmacy'::text, 'admin'::text]))))));

-- Create RLS policies for medication_dispensing
CREATE POLICY "Users can view dispensing records in their hospital" 
ON public.medication_dispensing 
FOR SELECT 
USING ((hospital_id = get_current_user_hospital_id()) OR is_admin());

CREATE POLICY "Pharmacy can create dispensing records" 
ON public.medication_dispensing 
FOR INSERT 
WITH CHECK ((auth.uid() = dispensed_by) AND (hospital_id = get_current_user_hospital_id()) AND (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = ANY (ARRAY['pharmacy'::text, 'admin'::text]))))));

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_medications_updated_at
BEFORE UPDATE ON public.medications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medication_inventory_updated_at
BEFORE UPDATE ON public.medication_inventory
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to get low stock medications
CREATE OR REPLACE FUNCTION public.get_low_stock_medications()
RETURNS TABLE (
  medication_name TEXT,
  total_quantity BIGINT,
  reorder_point INTEGER
)
LANGUAGE SQL
STABLE SECURITY DEFINER
AS $$
  SELECT 
    m.name,
    COALESCE(SUM(mi.quantity_on_hand), 0) as total_quantity,
    MIN(mi.reorder_point) as reorder_point
  FROM medications m
  LEFT JOIN medication_inventory mi ON m.id = mi.medication_id
  WHERE m.hospital_id = get_current_user_hospital_id()
    AND m.is_active = true
  GROUP BY m.id, m.name
  HAVING COALESCE(SUM(mi.quantity_on_hand), 0) <= MIN(mi.reorder_point);
$$;