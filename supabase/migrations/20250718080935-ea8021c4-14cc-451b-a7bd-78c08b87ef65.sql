-- Create hospitals table
CREATE TABLE public.hospitals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on hospitals table
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;

-- Add hospital_id to profiles table and update role enum
ALTER TABLE public.profiles 
ADD COLUMN hospital_id UUID REFERENCES public.hospitals(id);

-- Update role check constraint to include admin
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('doctor', 'nurse', 'finance', 'admin'));

-- Add hospital_id to patients table
ALTER TABLE public.patients 
ADD COLUMN hospital_id UUID REFERENCES public.hospitals(id);

-- Add hospital_id to appointments table
ALTER TABLE public.appointments 
ADD COLUMN hospital_id UUID REFERENCES public.hospitals(id);

-- Add hospital_id to visits table
ALTER TABLE public.visits 
ADD COLUMN hospital_id UUID REFERENCES public.hospitals(id);

-- Add hospital_id to bills table
ALTER TABLE public.bills 
ADD COLUMN hospital_id UUID REFERENCES public.hospitals(id);

-- Add hospital_id to vital_signs table
ALTER TABLE public.vital_signs 
ADD COLUMN hospital_id UUID REFERENCES public.hospitals(id);

-- Add hospital_id to services table
ALTER TABLE public.services 
ADD COLUMN hospital_id UUID REFERENCES public.hospitals(id);

-- Create function to get current user's hospital_id
CREATE OR REPLACE FUNCTION public.get_current_user_hospital_id()
RETURNS UUID AS $$
  SELECT hospital_id FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Update RLS policies for hospitals table
CREATE POLICY "Admins can manage all hospitals" 
ON public.hospitals 
FOR ALL 
USING (public.is_admin());

CREATE POLICY "Users can view their hospital" 
ON public.hospitals 
FOR SELECT 
USING (id = public.get_current_user_hospital_id() OR public.is_admin());

-- Update RLS policies for profiles table
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view profiles in their hospital" 
ON public.profiles 
FOR SELECT 
USING (
  hospital_id = public.get_current_user_hospital_id() 
  OR public.is_admin() 
  OR user_id = auth.uid()
);

CREATE POLICY "Admins can manage all profiles" 
ON public.profiles 
FOR ALL 
USING (public.is_admin());

-- Update RLS policies for patients table
DROP POLICY IF EXISTS "All authenticated users can view patients" ON public.patients;
DROP POLICY IF EXISTS "Nurses and doctors can register patients" ON public.patients;
DROP POLICY IF EXISTS "Nurses and doctors can update patients" ON public.patients;

CREATE POLICY "Users can view patients in their hospital" 
ON public.patients 
FOR SELECT 
USING (hospital_id = public.get_current_user_hospital_id() OR public.is_admin());

CREATE POLICY "Staff can register patients in their hospital" 
ON public.patients 
FOR INSERT 
WITH CHECK (
  auth.uid() = registered_by 
  AND hospital_id = public.get_current_user_hospital_id()
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('nurse', 'doctor', 'admin')
  )
);

CREATE POLICY "Staff can update patients in their hospital" 
ON public.patients 
FOR UPDATE 
USING (
  (hospital_id = public.get_current_user_hospital_id() OR public.is_admin())
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('nurse', 'doctor', 'admin')
  )
);

-- Update RLS policies for appointments table
DROP POLICY IF EXISTS "All authenticated users can view appointments" ON public.appointments;
DROP POLICY IF EXISTS "Nurses and doctors can create appointments" ON public.appointments;
DROP POLICY IF EXISTS "Nurses and doctors can update appointments" ON public.appointments;

CREATE POLICY "Users can view appointments in their hospital" 
ON public.appointments 
FOR SELECT 
USING (hospital_id = public.get_current_user_hospital_id() OR public.is_admin());

CREATE POLICY "Staff can create appointments in their hospital" 
ON public.appointments 
FOR INSERT 
WITH CHECK (
  auth.uid() = created_by 
  AND hospital_id = public.get_current_user_hospital_id()
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('nurse', 'doctor', 'admin')
  )
);

CREATE POLICY "Staff can update appointments in their hospital" 
ON public.appointments 
FOR UPDATE 
USING (
  (hospital_id = public.get_current_user_hospital_id() OR public.is_admin())
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('nurse', 'doctor', 'admin')
  )
);

-- Update RLS policies for visits table
DROP POLICY IF EXISTS "All authenticated users can view visits" ON public.visits;
DROP POLICY IF EXISTS "Doctors can create visits" ON public.visits;
DROP POLICY IF EXISTS "Doctors can update their visits" ON public.visits;

CREATE POLICY "Users can view visits in their hospital" 
ON public.visits 
FOR SELECT 
USING (hospital_id = public.get_current_user_hospital_id() OR public.is_admin());

CREATE POLICY "Doctors can create visits in their hospital" 
ON public.visits 
FOR INSERT 
WITH CHECK (
  auth.uid() = doctor_id 
  AND hospital_id = public.get_current_user_hospital_id()
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('doctor', 'admin')
  )
);

CREATE POLICY "Doctors can update visits in their hospital" 
ON public.visits 
FOR UPDATE 
USING (
  auth.uid() = doctor_id 
  AND (hospital_id = public.get_current_user_hospital_id() OR public.is_admin())
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('doctor', 'admin')
  )
);

-- Update RLS policies for bills table
DROP POLICY IF EXISTS "All authenticated users can view bills" ON public.bills;
DROP POLICY IF EXISTS "Staff can create bills" ON public.bills;
DROP POLICY IF EXISTS "Finance staff can update bills" ON public.bills;

CREATE POLICY "Users can view bills in their hospital" 
ON public.bills 
FOR SELECT 
USING (hospital_id = public.get_current_user_hospital_id() OR public.is_admin());

CREATE POLICY "Staff can create bills in their hospital" 
ON public.bills 
FOR INSERT 
WITH CHECK (
  auth.uid() = created_by 
  AND hospital_id = public.get_current_user_hospital_id()
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('nurse', 'doctor', 'finance', 'admin')
  )
);

CREATE POLICY "Finance staff can update bills in their hospital" 
ON public.bills 
FOR UPDATE 
USING (
  (hospital_id = public.get_current_user_hospital_id() OR public.is_admin())
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('finance', 'admin')
  )
);

-- Update RLS policies for vital_signs table
DROP POLICY IF EXISTS "All authenticated users can view vital signs" ON public.vital_signs;
DROP POLICY IF EXISTS "Nurses can record vital signs" ON public.vital_signs;

CREATE POLICY "Users can view vital signs in their hospital" 
ON public.vital_signs 
FOR SELECT 
USING (hospital_id = public.get_current_user_hospital_id() OR public.is_admin());

CREATE POLICY "Nurses can record vital signs in their hospital" 
ON public.vital_signs 
FOR INSERT 
WITH CHECK (
  auth.uid() = recorded_by 
  AND hospital_id = public.get_current_user_hospital_id()
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('nurse', 'admin')
  )
);

-- Update RLS policies for services table
DROP POLICY IF EXISTS "All authenticated users can view services" ON public.services;
DROP POLICY IF EXISTS "Doctors can manage services" ON public.services;

CREATE POLICY "Users can view services in their hospital" 
ON public.services 
FOR SELECT 
USING (hospital_id = public.get_current_user_hospital_id() OR public.is_admin());

CREATE POLICY "Doctors and admins can manage services" 
ON public.services 
FOR ALL 
USING (
  (hospital_id = public.get_current_user_hospital_id() OR public.is_admin())
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('doctor', 'admin')
  )
);

-- Update RLS policies for bill_items table
DROP POLICY IF EXISTS "All authenticated users can view bill items" ON public.bill_items;
DROP POLICY IF EXISTS "Staff can create bill items" ON public.bill_items;

CREATE POLICY "Users can view bill items in their hospital" 
ON public.bill_items 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM bills 
    WHERE bills.id = bill_items.bill_id 
    AND (bills.hospital_id = public.get_current_user_hospital_id() OR public.is_admin())
  )
);

CREATE POLICY "Staff can create bill items in their hospital" 
ON public.bill_items 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM bills 
    WHERE bills.id = bill_items.bill_id 
    AND bills.hospital_id = public.get_current_user_hospital_id()
  )
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('nurse', 'doctor', 'finance', 'admin')
  )
);

-- Update RLS policies for prescriptions table
DROP POLICY IF EXISTS "All authenticated users can view prescriptions" ON public.prescriptions;
DROP POLICY IF EXISTS "Doctors can create prescriptions" ON public.prescriptions;

CREATE POLICY "Users can view prescriptions in their hospital" 
ON public.prescriptions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM visits 
    WHERE visits.id = prescriptions.visit_id 
    AND (visits.hospital_id = public.get_current_user_hospital_id() OR public.is_admin())
  )
);

CREATE POLICY "Doctors can create prescriptions in their hospital" 
ON public.prescriptions 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM visits v
    JOIN profiles p ON p.user_id = auth.uid()
    WHERE v.id = prescriptions.visit_id 
    AND v.doctor_id = auth.uid() 
    AND v.hospital_id = public.get_current_user_hospital_id()
    AND p.role IN ('doctor', 'admin')
  )
);

-- Create trigger for automatic timestamp updates on hospitals
CREATE TRIGGER update_hospitals_updated_at
BEFORE UPDATE ON public.hospitals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_profiles_hospital_id ON public.profiles(hospital_id);
CREATE INDEX idx_patients_hospital_id ON public.patients(hospital_id);
CREATE INDEX idx_appointments_hospital_id ON public.appointments(hospital_id);
CREATE INDEX idx_visits_hospital_id ON public.visits(hospital_id);
CREATE INDEX idx_bills_hospital_id ON public.bills(hospital_id);
CREATE INDEX idx_vital_signs_hospital_id ON public.vital_signs(hospital_id);
CREATE INDEX idx_services_hospital_id ON public.services(hospital_id);