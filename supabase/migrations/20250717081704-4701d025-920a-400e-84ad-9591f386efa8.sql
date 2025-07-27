-- Step 1: Update all references to point to the oldest patient record for each duplicate

-- For Jennifer Obadele - merge all to oldest record (2b268f8a-a7ac-4930-b775-c24e8ed4912e)
UPDATE visits SET patient_id = '2b268f8a-a7ac-4930-b775-c24e8ed4912e' 
WHERE patient_id = 'effdf5f5-b749-49eb-8f1c-4d79c896ec87';

UPDATE bills SET patient_id = '2b268f8a-a7ac-4930-b775-c24e8ed4912e' 
WHERE patient_id = 'effdf5f5-b749-49eb-8f1c-4d79c896ec87';

UPDATE appointments SET patient_id = '2b268f8a-a7ac-4930-b775-c24e8ed4912e' 
WHERE patient_id IN ('effdf5f5-b749-49eb-8f1c-4d79c896ec87', 'cd4ca5db-f6cc-4748-bc3a-4b15cb2b969e');

UPDATE vital_signs SET patient_id = '2b268f8a-a7ac-4930-b775-c24e8ed4912e' 
WHERE patient_id IN ('effdf5f5-b749-49eb-8f1c-4d79c896ec87', 'cd4ca5db-f6cc-4748-bc3a-4b15cb2b969e');

-- For Adeleye Moruf - merge all to oldest record (516b2919-bebb-4dec-901d-9fdec9a7a3c3)
UPDATE appointments SET patient_id = '516b2919-bebb-4dec-901d-9fdec9a7a3c3' 
WHERE patient_id IN ('6200bd13-56e1-4efd-9f30-a9acf0584ce2', '1093383a-6a38-4998-8b6e-dcc4da075623');

UPDATE vital_signs SET patient_id = '516b2919-bebb-4dec-901d-9fdec9a7a3c3' 
WHERE patient_id IN ('6200bd13-56e1-4efd-9f30-a9acf0584ce2', '1093383a-6a38-4998-8b6e-dcc4da075623');