-- Create visits table to record patient visit details
CREATE TABLE public.visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL,
  patient_id UUID NOT NULL,
  doctor_id UUID NOT NULL,
  visit_date DATE NOT NULL,
  visit_time TIME NOT NULL,
  complaints TEXT,
  diagnosis TEXT,
  treatment_plan TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create prescriptions table for prescribed medications/services
CREATE TABLE public.prescriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visit_id UUID NOT NULL,
  service_id UUID NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for visits
CREATE POLICY "All authenticated users can view visits" 
ON public.visits 
FOR SELECT 
USING (true);

CREATE POLICY "Doctors can create visits" 
ON public.visits 
FOR INSERT 
WITH CHECK (auth.uid() = doctor_id AND EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'doctor'
));

CREATE POLICY "Doctors can update their visits" 
ON public.visits 
FOR UPDATE 
USING (auth.uid() = doctor_id AND EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'doctor'
));

-- Create policies for prescriptions
CREATE POLICY "All authenticated users can view prescriptions" 
ON public.prescriptions 
FOR SELECT 
USING (true);

CREATE POLICY "Doctors can create prescriptions" 
ON public.prescriptions 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM visits v
  JOIN profiles p ON p.user_id = auth.uid()
  WHERE v.id = visit_id 
  AND v.doctor_id = auth.uid()
  AND p.role = 'doctor'
));

-- Create foreign key relationships
ALTER TABLE public.visits 
ADD CONSTRAINT visits_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES appointments(id),
ADD CONSTRAINT visits_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id);

ALTER TABLE public.prescriptions 
ADD CONSTRAINT prescriptions_visit_id_fkey FOREIGN KEY (visit_id) REFERENCES visits(id),
ADD CONSTRAINT prescriptions_service_id_fkey FOREIGN KEY (service_id) REFERENCES services(id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_visits_updated_at
  BEFORE UPDATE ON public.visits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();