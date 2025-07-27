-- Create vital_signs table for queue management and triage assessment
CREATE TABLE public.vital_signs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  recorded_by UUID NOT NULL,
  body_temperature DECIMAL(4,1),
  heart_rate INTEGER,
  weight DECIMAL(5,2),
  blood_pressure_systolic INTEGER,
  blood_pressure_diastolic INTEGER,
  oxygen_saturation DECIMAL(4,1),
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.vital_signs ENABLE ROW LEVEL SECURITY;

-- Create policies for vital signs
CREATE POLICY "All authenticated users can view vital signs" 
ON public.vital_signs 
FOR SELECT 
USING (true);

CREATE POLICY "Nurses can record vital signs" 
ON public.vital_signs 
FOR INSERT 
WITH CHECK (
  auth.uid() = recorded_by AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() AND role = 'nurse'
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_vital_signs_updated_at
BEFORE UPDATE ON public.vital_signs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();