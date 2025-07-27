-- Insert popular medications for pharmacy dashboard testing
INSERT INTO public.medications (name, dosage, form, manufacturer, category, description, hospital_id) VALUES
('Paracetamol', '500mg', 'Tablet', 'GSK', 'Analgesics', 'Pain reliever and fever reducer', (SELECT id FROM hospitals LIMIT 1)),
('Amoxicillin', '250mg', 'Capsule', 'Pfizer', 'Antibiotics', 'Broad-spectrum antibiotic', (SELECT id FROM hospitals LIMIT 1)),
('Metformin', '500mg', 'Tablet', 'Teva', 'Antidiabetics', 'Type 2 diabetes medication', (SELECT id FROM hospitals LIMIT 1)),
('Lisinopril', '10mg', 'Tablet', 'Novartis', 'ACE Inhibitors', 'Blood pressure medication', (SELECT id FROM hospitals LIMIT 1)),
('Omeprazole', '20mg', 'Capsule', 'AstraZeneca', 'Proton Pump Inhibitors', 'Acid reflux and stomach ulcer treatment', (SELECT id FROM hospitals LIMIT 1));

-- Insert corresponding inventory records with stock levels
INSERT INTO public.medication_inventory (medication_id, quantity_on_hand, quantity_received, unit_cost, total_cost, received_date, reorder_point, hospital_id, expiry_date, supplier, batch_number) VALUES
((SELECT id FROM medications WHERE name = 'Paracetamol' LIMIT 1), 250, 500, 0.15, 75.00, CURRENT_DATE - interval '30 days', 50, (SELECT id FROM hospitals LIMIT 1), CURRENT_DATE + interval '2 years', 'MedSupply Co.', 'PAR2024001'),
((SELECT id FROM medications WHERE name = 'Amoxicillin' LIMIT 1), 180, 200, 2.50, 500.00, CURRENT_DATE - interval '15 days', 30, (SELECT id FROM hospitals LIMIT 1), CURRENT_DATE + interval '18 months', 'PharmaDist Ltd.', 'AMX2024002'),
((SELECT id FROM medications WHERE name = 'Metformin' LIMIT 1), 320, 400, 0.80, 320.00, CURRENT_DATE - interval '20 days', 75, (SELECT id FROM hospitals LIMIT 1), CURRENT_DATE + interval '3 years', 'HealthCare Supplies', 'MET2024003'),
((SELECT id FROM medications WHERE name = 'Lisinopril' LIMIT 1), 95, 150, 1.20, 180.00, CURRENT_DATE - interval '10 days', 25, (SELECT id FROM hospitals LIMIT 1), CURRENT_DATE + interval '2 years', 'CardioMeds Inc.', 'LIS2024004'),
((SELECT id FROM medications WHERE name = 'Omeprazole' LIMIT 1), 140, 200, 3.00, 600.00, CURRENT_DATE - interval '5 days', 40, (SELECT id FROM hospitals LIMIT 1), CURRENT_DATE + interval '1 year', 'GastroPharm', 'OME2024005');