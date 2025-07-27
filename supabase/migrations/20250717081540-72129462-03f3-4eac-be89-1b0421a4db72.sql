-- Remove duplicate patients, keeping the oldest entry for each
DELETE FROM patients 
WHERE id IN (
  SELECT id FROM (
    SELECT id, 
           ROW_NUMBER() OVER (
             PARTITION BY LOWER(TRIM(first_name)), LOWER(TRIM(last_name)), email, phone 
             ORDER BY created_at ASC
           ) as rn
    FROM patients 
    WHERE email IS NOT NULL AND phone IS NOT NULL
  ) t 
  WHERE rn > 1
);

-- Add unique constraint to prevent future duplicates based on email and phone
ALTER TABLE patients 
ADD CONSTRAINT unique_patient_email_phone 
UNIQUE (email, phone);