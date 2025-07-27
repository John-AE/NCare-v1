-- First, let's identify and remove duplicate appointments, keeping only the earliest created one
WITH duplicates AS (
  SELECT id, 
         ROW_NUMBER() OVER (PARTITION BY scheduled_date, start_time ORDER BY created_at ASC) as row_num
  FROM public.appointments
)
DELETE FROM public.appointments 
WHERE id IN (
  SELECT id FROM duplicates WHERE row_num > 1
);

-- Now add the unique constraint to prevent future double-booking
ALTER TABLE public.appointments 
ADD CONSTRAINT appointments_unique_time_slot 
UNIQUE (scheduled_date, start_time);