-- Delete services with hospital_id that were manually added
DELETE FROM services WHERE hospital_id IS NOT NULL;