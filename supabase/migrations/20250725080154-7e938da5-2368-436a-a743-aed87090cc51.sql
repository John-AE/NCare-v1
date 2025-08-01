-- First delete prescriptions that reference services with hospital_id
DELETE FROM prescriptions 
WHERE service_id IN (
  SELECT id FROM services WHERE hospital_id IS NOT NULL
);

-- Then delete bill items that reference services with hospital_id
DELETE FROM bill_items 
WHERE service_id IN (
  SELECT id FROM services WHERE hospital_id IS NOT NULL
);

-- Finally delete services with hospital_id that were manually added
DELETE FROM services WHERE hospital_id IS NOT NULL;