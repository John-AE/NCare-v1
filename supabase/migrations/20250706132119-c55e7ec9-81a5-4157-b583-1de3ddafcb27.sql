-- Create appointments table for scheduling system
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  doctor_id UUID,
  scheduled_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key constraints
ALTER TABLE public.appointments 
ADD CONSTRAINT appointments_patient_id_fkey 
FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;

-- Enable Row Level Security
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Create policies for appointments
CREATE POLICY "All authenticated users can view appointments" 
ON public.appointments 
FOR SELECT 
USING (true);

CREATE POLICY "Nurses and doctors can create appointments" 
ON public.appointments 
FOR INSERT 
WITH CHECK (
  auth.uid() = created_by AND 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('nurse', 'doctor')
  )
);

CREATE POLICY "Nurses and doctors can update appointments" 
ON public.appointments 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('nurse', 'doctor')
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance on date queries
CREATE INDEX idx_appointments_scheduled_date ON public.appointments(scheduled_date);
CREATE INDEX idx_appointments_patient_id ON public.appointments(patient_id);