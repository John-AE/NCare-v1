-- First, add prescriptions column to visits table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='visits' AND column_name='prescriptions') THEN
        ALTER TABLE visits ADD COLUMN prescriptions TEXT;
    END IF;
END $$;

-- Add user status management to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Add bill adjustment tracking
CREATE TABLE IF NOT EXISTS public.bill_adjustments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  original_amount NUMERIC(10,2) NOT NULL,
  new_amount NUMERIC(10,2) NOT NULL,
  adjustment_reason TEXT NOT NULL,
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('void', 'adjust')),
  adjusted_by UUID NOT NULL,
  adjusted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  hospital_id UUID REFERENCES hospitals(id)
);

-- Add discount fields to bills
ALTER TABLE bills ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) DEFAULT 0;
ALTER TABLE bills ADD COLUMN IF NOT EXISTS discount_reason TEXT;

-- Add payment history tracking
CREATE TABLE IF NOT EXISTS public.payment_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  payment_amount NUMERIC(10,2) NOT NULL,
  payment_method TEXT NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  paid_by UUID NOT NULL,
  notes TEXT,
  hospital_id UUID REFERENCES hospitals(id)
);

-- Enable RLS on new tables
ALTER TABLE public.bill_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

-- Create policies for bill_adjustments
CREATE POLICY "Users can view bill adjustments in their hospital" 
ON public.bill_adjustments 
FOR SELECT 
USING ((hospital_id = get_current_user_hospital_id()) OR is_admin());

CREATE POLICY "Finance staff can create bill adjustments" 
ON public.bill_adjustments 
FOR INSERT 
WITH CHECK ((auth.uid() = adjusted_by) AND (hospital_id = get_current_user_hospital_id()) AND (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = ANY (ARRAY['finance'::text, 'doctor'::text, 'admin'::text]))))));

-- Create policies for payment_history
CREATE POLICY "Users can view payment history in their hospital" 
ON public.payment_history 
FOR SELECT 
USING ((hospital_id = get_current_user_hospital_id()) OR is_admin());

CREATE POLICY "Finance staff can create payment records" 
ON public.payment_history 
FOR INSERT 
WITH CHECK ((auth.uid() = paid_by) AND (hospital_id = get_current_user_hospital_id()) AND (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.user_id = auth.uid()) AND (profiles.role = ANY (ARRAY['finance'::text, 'admin'::text]))))));

-- Populate services with categorized data from the image
INSERT INTO services (name, category, price, hospital_id, description) VALUES
-- Consultation Services
('Cardiology Consultation', 'Consultation', 25000.00, NULL, 'Specialist heart consultation'),
('Dental Consultation', 'Consultation', 15000.00, NULL, 'General dental examination'),
('Dermatology Consultation', 'Consultation', 15000.00, NULL, 'Skin specialist consultation'),
('ENT Consultation', 'Consultation', 15000.00, NULL, 'Ear, Nose & Throat specialist'),
('General Consultation', 'Consultation', 10000.00, NULL, 'General practitioner consultation'),
('Neurology Consultation', 'Consultation', 25000.00, NULL, 'Neurological specialist consultation'),
('Obstetric Consultation', 'Consultation', 25000.00, NULL, 'Pregnancy and childbirth specialist'),
('Ophthalmology Consultation', 'Consultation', 25000.00, NULL, 'Eye specialist consultation'),
('Orthopedic Consultation', 'Consultation', 25000.00, NULL, 'Bone and joint specialist'),
('Pediatric Consultation', 'Consultation', 25000.00, NULL, 'Children''s specialist consultation'),
('Psychiatric Evaluation', 'Consultation', 25000.00, NULL, 'Mental health evaluation'),
('Surgical Consultation', 'Consultation', 25000.00, NULL, 'Pre-surgical evaluation'),
('Urology Consultation', 'Consultation', 10000.00, NULL, 'Urinary system specialist'),

-- Lab Tests
('Blood Genotype', 'Lab Tests', 500.00, NULL, 'Blood genotype testing'),
('Blood Glucose', 'Lab Tests', 2500.00, NULL, 'Blood sugar level test'),
('Blood Grouping & Typing', 'Lab Tests', 2500.00, NULL, 'Blood group determination'),
('Coagulation Profile (PT, aPTT)', 'Lab Tests', 2500.00, NULL, 'Blood clotting tests'),
('COVID-19 PCR', 'Lab Tests', 2500.00, NULL, 'COVID-19 molecular test'),
('Culture & Sensitivity (Urine/Throat/CSF)', 'Lab Tests', 2500.00, NULL, 'Bacterial culture and antibiotic sensitivity'),
('ESR', 'Lab Tests', 2500.00, NULL, 'Erythrocyte sedimentation rate'),
('Full Blood Count (FBC)', 'Lab Tests', 3500.00, NULL, 'Complete blood count'),
('HbsAg', 'Lab Tests', 3500.00, NULL, 'Hepatitis B surface antigen'),
('HIV Screening', 'Lab Tests', 3500.00, NULL, 'HIV antibody test'),
('Kidney Function Test', 'Lab Tests', 3500.00, NULL, 'Creatinine and urea tests'),
('Lipid Profile', 'Lab Tests', 5000.00, NULL, 'Cholesterol and lipid levels'),
('Liver Function Test', 'Lab Tests', 5000.00, NULL, 'Liver enzyme tests'),
('Malaria Test', 'Lab Tests', 2000.00, NULL, 'Malaria parasite detection'),
('Pregnancy Test (Urine/Blood)', 'Lab Tests', 5000.00, NULL, 'Pregnancy hormone detection'),
('Stool Analysis', 'Lab Tests', 2000.00, NULL, 'Stool examination'),
('Typhoid Test (Widal)', 'Lab Tests', 2500.00, NULL, 'Typhoid fever antibody test'),
('Urinalysis', 'Lab Tests', 5000.00, NULL, 'Urine examination'),

-- Imaging & Radiology
('CT Scan (Head, Chest, Abdomen)', 'Imaging & Radiology', 20000.00, NULL, 'Computed tomography scan'),
('Doppler Ultrasound', 'Imaging & Radiology', 20000.00, NULL, 'Blood flow assessment'),
('Echocardiogram', 'Imaging & Radiology', 20000.00, NULL, 'Heart ultrasound'),
('Fluoroscopy', 'Imaging & Radiology', 20000.00, NULL, 'Real-time X-ray imaging'),
('Hysterosalpingogram (HSG)', 'Imaging & Radiology', 20000.00, NULL, 'Fallopian tube X-ray'),
('Mammography', 'Imaging & Radiology', 20000.00, NULL, 'Breast imaging'),
('MRI', 'Imaging & Radiology', 20000.00, NULL, 'Magnetic resonance imaging'),
('Ultrasound (Abdominal, Pelvic, Obstetric)', 'Imaging & Radiology', 20000.00, NULL, 'Ultrasound examination'),
('X-Ray (Chest, Limb, Spine)', 'Imaging & Radiology', 5000.00, NULL, 'X-ray imaging'),

-- Procedures (Minor & Major)
('Biopsy (Skin, Breast)', 'Procedures (Minor & Major)', 12000.00, NULL, 'Tissue sample collection'),
('Circumcision', 'Procedures (Minor & Major)', 12000.00, NULL, 'Male circumcision procedure'),
('Colonoscopy', 'Procedures (Minor & Major)', 20000.00, NULL, 'Colon examination'),
('Dilation & Curettage (D&C)', 'Procedures (Minor & Major)', 20000.00, NULL, 'Uterine procedure'),
('Endoscopy', 'Procedures (Minor & Major)', 20000.00, NULL, 'Internal organ examination'),
('Gastroscopy', 'Procedures (Minor & Major)', 20000.00, NULL, 'Stomach examination'),
('Incision & Drainage', 'Procedures (Minor & Major)', 10000.00, NULL, 'Abscess drainage'),
('Lumbar Puncture', 'Procedures (Minor & Major)', 4000.00, NULL, 'Spinal fluid collection'),
('Manual Vacuum Aspiration (MVA)', 'Procedures (Minor & Major)', 15000.00, NULL, 'Uterine evacuation'),
('Nebulization', 'Procedures (Minor & Major)', 2000.00, NULL, 'Respiratory therapy'),
('Pap Smear', 'Procedures (Minor & Major)', 5000.00, NULL, 'Cervical cancer screening'),
('Suturing', 'Procedures (Minor & Major)', 3000.00, NULL, 'Wound closure'),
('Urinary Catheterization', 'Procedures (Minor & Major)', 10000.00, NULL, 'Urinary catheter insertion'),
('Wound Dressing', 'Procedures (Minor & Major)', 1000.00, NULL, 'Wound care'),

-- Surgical Services
('Amputation', 'Surgical Services', 25000.00, NULL, 'Limb amputation surgery'),
('Appendectomy', 'Surgical Services', 25000.00, NULL, 'Appendix removal'),
('Cataract Surgery', 'Surgical Services', 25000.00, NULL, 'Cataract removal surgery'),
('Cesarean Section (C-Section)', 'Surgical Services', 25000.00, NULL, 'Cesarean delivery'),
('Cholecystectomy', 'Surgical Services', 25000.00, NULL, 'Gallbladder removal'),
('Hernia Repair', 'Surgical Services', 25000.00, NULL, 'Hernia surgical repair'),
('Hysterectomy', 'Surgical Services', 25000.00, NULL, 'Uterus removal surgery'),
('Laparotomy', 'Surgical Services', 25000.00, NULL, 'Abdominal surgery'),
('Mastectomy', 'Surgical Services', 25000.00, NULL, 'Breast removal surgery'),
('Prostatectomy', 'Surgical Services', 5000.00, NULL, 'Prostate removal'),
('Tonsillectomy', 'Surgical Services', 25000.00, NULL, 'Tonsil removal surgery'),

-- Ward Admission / Bed Fees
('Admission Fee', 'Ward Admission / Bed Fees', 5000.00, NULL, 'Hospital admission fee'),
('General Ward Admission (per day)', 'Ward Admission / Bed Fees', 4000.00, NULL, 'General ward daily fee'),
('ICU (per day)', 'Ward Admission / Bed Fees', 25000.00, NULL, 'Intensive care unit daily fee'),
('Maternity Ward Admission', 'Ward Admission / Bed Fees', 4000.00, NULL, 'Maternity ward fee'),
('NICU (per day)', 'Ward Admission / Bed Fees', 4000.00, NULL, 'Neonatal ICU daily fee'),
('Pediatric Ward', 'Ward Admission / Bed Fees', 4000.00, NULL, 'Children''s ward fee'),
('Private Ward', 'Ward Admission / Bed Fees', 30000.00, NULL, 'Private room daily fee'),
('Semi-private Ward', 'Ward Admission / Bed Fees', 20000.00, NULL, 'Semi-private room daily fee'),
('Surgical Ward Bed Fee', 'Ward Admission / Bed Fees', 10000.00, NULL, 'Surgical ward daily fee'),

-- Antenatal & Maternity
('Antenatal Registration', 'Antenatal & Maternity', 10000.00, NULL, 'Pregnancy registration'),
('Birth Registration', 'Antenatal & Maternity', 30000.00, NULL, 'Birth certificate processing'),
('Cesarean Section', 'Antenatal & Maternity', 45000.00, NULL, 'Cesarean delivery'),
('Delivery (Normal)', 'Antenatal & Maternity', 35000.00, NULL, 'Normal vaginal delivery'),
('Malaria Prophylaxis', 'Antenatal & Maternity', 10000.00, NULL, 'Malaria prevention in pregnancy'),
('Postnatal Care Visit', 'Antenatal & Maternity', 10000.00, NULL, 'Post-delivery care'),
('Routine ANC Visit', 'Antenatal & Maternity', 8000.00, NULL, 'Antenatal care visit'),
('Tetanus Injection', 'Antenatal & Maternity', 10000.00, NULL, 'Tetanus immunization'),
('Ultrasound in Pregnancy', 'Antenatal & Maternity', 15000.00, NULL, 'Pregnancy ultrasound'),

-- Pharmacy / Medications
('Analgesics (Paracetamol, Ibuprofen)', 'Pharmacy / Medications', 300.00, NULL, 'Pain relief medications'),
('Antibiotics (Amoxicillin, Ciprofloxacin, etc.)', 'Pharmacy / Medications', 1500.00, NULL, 'Antibiotic medications'),
('Antihypertensives', 'Pharmacy / Medications', 1500.00, NULL, 'Blood pressure medications'),
('Antimalarials', 'Pharmacy / Medications', 1000.00, NULL, 'Malaria treatment drugs'),
('Diabetic Medications', 'Pharmacy / Medications', 1500.00, NULL, 'Diabetes management drugs'),
('Dispensing Fee', 'Pharmacy / Medications', 200.00, NULL, 'Medication dispensing service'),
('Supplements', 'Pharmacy / Medications', 1000.00, NULL, 'Vitamin and mineral supplements'),
('Vaccines (Hep B, COVID-19, Yellow Fever)', 'Pharmacy / Medications', 2000.00, NULL, 'Immunization vaccines'),

-- Nursing Services
('Catheter Care', 'Nursing Services', 5000.00, NULL, 'Catheter maintenance'),
('Drug Administration (Oral/IV/IM)', 'Nursing Services', 1000.00, NULL, 'Medication administration'),
('Enemas', 'Nursing Services', 4000.00, NULL, 'Bowel cleansing procedure'),
('Injections', 'Nursing Services', 1000.00, NULL, 'Injection administration'),
('Intravenous Cannulation', 'Nursing Services', 1500.00, NULL, 'IV line insertion'),
('IV Fluids Setup', 'Nursing Services', 1000.00, NULL, 'Intravenous fluid administration'),
('Patient Feeding', 'Nursing Services', 5000.00, NULL, 'Assisted feeding service'),
('Vital Signs Monitoring', 'Nursing Services', 1250.00, NULL, 'Vital signs assessment'),

-- Emergency Services
('Ambulance Service', 'Emergency Services', 15000.00, NULL, 'Emergency transport'),
('Emergency Consultation', 'Emergency Services', 5000.00, NULL, 'Emergency medical consultation'),
('Emergency Surgery', 'Emergency Services', 20000.00, NULL, 'Emergency surgical intervention'),
('First Aid Fee', 'Emergency Services', 2000.00, NULL, 'Basic first aid treatment'),
('Oxygen Administration', 'Emergency Services', 7000.00, NULL, 'Oxygen therapy'),
('Resuscitation', 'Emergency Services', 10000.00, NULL, 'Emergency resuscitation'),
('Triage', 'Emergency Services', 2000.00, NULL, 'Emergency triage assessment'),

-- Continue with remaining categories...
-- Pediatrics & Immunization
('Child Consultation', 'Pediatrics & Immunization', 2000.00, NULL, 'Pediatric consultation'),
('Deworming', 'Pediatrics & Immunization', 1000.00, NULL, 'Deworming treatment'),
('Growth Monitoring', 'Pediatrics & Immunization', 2000.00, NULL, 'Child growth assessment'),
('Measles Vaccination', 'Pediatrics & Immunization', 1000.00, NULL, 'Measles immunization'),
('Pediatric Lab Tests', 'Pediatrics & Immunization', 2000.00, NULL, 'Laboratory tests for children'),
('Routine Immunization (BCG, OPV, DPT, Hep B)', 'Pediatrics & Immunization', 2000.00, NULL, 'Childhood immunizations'),
('Vitamin A Supplementation', 'Pediatrics & Immunization', 1000.00, NULL, 'Vitamin A for children'),

-- Dental Services
('Braces Consultation', 'Dental Services', 5000.00, NULL, 'Orthodontic consultation'),
('Dental Surgery', 'Dental Services', 10000.00, NULL, 'Oral surgery procedures'),
('Dental X-Ray', 'Dental Services', 3000.00, NULL, 'Dental radiography'),
('Denture Fitting', 'Dental Services', 10000.00, NULL, 'Denture placement'),
('Filling', 'Dental Services', 2000.00, NULL, 'Dental cavity filling'),
('Root Canal Treatment', 'Dental Services', 2300.00, NULL, 'Endodontic treatment'),
('Scaling & Polishing', 'Dental Services', 1500.00, NULL, 'Professional teeth cleaning'),
('Tooth Extraction', 'Dental Services', 2000.00, NULL, 'Tooth removal'),

-- Continue with remaining services from images...
ON CONFLICT (name, hospital_id) DO NOTHING;