-- Step 2: Now safely remove the duplicate patient records
DELETE FROM patients 
WHERE id IN (
  'effdf5f5-b749-49eb-8f1c-4d79c896ec87', 
  'cd4ca5db-f6cc-4748-bc3a-4b15cb2b969e',
  '6200bd13-56e1-4efd-9f30-a9acf0584ce2', 
  '1093383a-6a38-4998-8b6e-dcc4da075623'
);

-- Step 3: Add unique constraint to prevent future duplicates
ALTER TABLE patients 
ADD CONSTRAINT unique_patient_email_phone 
UNIQUE (email, phone);