-- Create services table for billing
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bill_items table to track services in each bill
CREATE TABLE public.bill_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_items ENABLE ROW LEVEL SECURITY;

-- Create policies for services
CREATE POLICY "All authenticated users can view services" 
ON public.services 
FOR SELECT 
USING (true);

CREATE POLICY "Doctors can manage services" 
ON public.services 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'doctor'
));

-- Create policies for bill_items
CREATE POLICY "All authenticated users can view bill items" 
ON public.bill_items 
FOR SELECT 
USING (true);

CREATE POLICY "Staff can create bill items" 
ON public.bill_items 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = ANY (ARRAY['nurse', 'doctor', 'finance'])
));

-- Create trigger for services updated_at
CREATE TRIGGER update_services_updated_at
BEFORE UPDATE ON public.services
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default services
INSERT INTO public.services (name, description, price, category) VALUES
('General Consultation', 'Basic medical consultation', 5000, 'Consultation'),
('Blood Pressure Check', 'Blood pressure measurement', 1000, 'Vital Signs'),
('Blood Test', 'Complete blood count', 3000, 'Laboratory'),
('X-Ray', 'Chest X-Ray examination', 8000, 'Radiology'),
('ECG', 'Electrocardiogram', 4000, 'Cardiology'),
('Prescription', 'Medication prescription', 500, 'Pharmacy'),
('Wound Dressing', 'Wound cleaning and dressing', 2000, 'Treatment'),
('Injection', 'Medication injection', 1500, 'Treatment'),
('Ultrasound', 'Ultrasound examination', 10000, 'Radiology'),
('Minor Surgery', 'Minor surgical procedure', 15000, 'Surgery');