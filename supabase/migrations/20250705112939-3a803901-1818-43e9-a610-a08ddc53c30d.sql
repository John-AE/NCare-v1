-- Create bills table for tracking patient bills
CREATE TABLE public.bills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  is_paid BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  paid_at TIMESTAMP WITH TIME ZONE,
  paid_by UUID
);

-- Enable Row Level Security
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;

-- Create policies for bills
CREATE POLICY "All authenticated users can view bills" 
ON public.bills 
FOR SELECT 
USING (true);

CREATE POLICY "Staff can create bills" 
ON public.bills 
FOR INSERT 
WITH CHECK (auth.uid() = created_by AND EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() 
  AND role IN ('nurse', 'doctor', 'finance')
));

CREATE POLICY "Finance staff can update bills" 
ON public.bills 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE user_id = auth.uid() 
  AND role = 'finance'
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_bills_updated_at
BEFORE UPDATE ON public.bills
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();