-- Continue adding remaining services
INSERT INTO services (name, category, price, hospital_id, description) VALUES
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
('Delivery (Normal)', 'Antenatal & Maternity', 35000.00, NULL, 'Normal vaginal delivery'),
('Malaria Prophylaxis', 'Antenatal & Maternity', 10000.00, NULL, 'Malaria prevention in pregnancy'),
('Postnatal Care Visit', 'Antenatal & Maternity', 10000.00, NULL, 'Post-delivery care'),
('Routine ANC Visit', 'Antenatal & Maternity', 8000.00, NULL, 'Antenatal care visit'),
('Tetanus Injection', 'Antenatal & Maternity', 10000.00, NULL, 'Tetanus immunization'),
('Ultrasound in Pregnancy', 'Antenatal & Maternity', 15000.00, NULL, 'Pregnancy ultrasound');

-- Pharmacy / Medications
INSERT INTO services (name, category, price, hospital_id, description) VALUES
('Analgesics (Paracetamol, Ibuprofen)', 'Pharmacy / Medications', 300.00, NULL, 'Pain relief medications'),
('Antibiotics (Amoxicillin, Ciprofloxacin, etc.)', 'Pharmacy / Medications', 1500.00, NULL, 'Antibiotic medications'),
('Antihypertensives', 'Pharmacy / Medications', 1500.00, NULL, 'Blood pressure medications'),
('Antimalarials', 'Pharmacy / Medications', 1000.00, NULL, 'Malaria treatment drugs'),
('Diabetic Medications', 'Pharmacy / Medications', 1500.00, NULL, 'Diabetes management drugs'),
('Dispensing Fee', 'Pharmacy / Medications', 200.00, NULL, 'Medication dispensing service'),
('Supplements', 'Pharmacy / Medications', 1000.00, NULL, 'Vitamin and mineral supplements'),
('Vaccines (Hep B, COVID-19, Yellow Fever)', 'Pharmacy / Medications', 2000.00, NULL, 'Immunization vaccines');

-- Nursing Services
INSERT INTO services (name, category, price, hospital_id, description) VALUES
('Catheter Care', 'Nursing Services', 5000.00, NULL, 'Catheter maintenance'),
('Drug Administration (Oral/IV/IM)', 'Nursing Services', 1000.00, NULL, 'Medication administration'),
('Enemas', 'Nursing Services', 4000.00, NULL, 'Bowel cleansing procedure'),
('Injections', 'Nursing Services', 1000.00, NULL, 'Injection administration'),
('Intravenous Cannulation', 'Nursing Services', 1500.00, NULL, 'IV line insertion'),
('IV Fluids Setup', 'Nursing Services', 1000.00, NULL, 'Intravenous fluid administration'),
('Patient Feeding', 'Nursing Services', 5000.00, NULL, 'Assisted feeding service'),
('Vital Signs Monitoring', 'Nursing Services', 1250.00, NULL, 'Vital signs assessment');

-- Emergency Services
INSERT INTO services (name, category, price, hospital_id, description) VALUES
('Ambulance Service', 'Emergency Services', 15000.00, NULL, 'Emergency transport'),
('Emergency Consultation', 'Emergency Services', 5000.00, NULL, 'Emergency medical consultation'),
('Emergency Surgery', 'Emergency Services', 20000.00, NULL, 'Emergency surgical intervention'),
('First Aid Fee', 'Emergency Services', 2000.00, NULL, 'Basic first aid treatment'),
('Oxygen Administration', 'Emergency Services', 7000.00, NULL, 'Oxygen therapy'),
('Resuscitation', 'Emergency Services', 10000.00, NULL, 'Emergency resuscitation'),
('Triage', 'Emergency Services', 2000.00, NULL, 'Emergency triage assessment');