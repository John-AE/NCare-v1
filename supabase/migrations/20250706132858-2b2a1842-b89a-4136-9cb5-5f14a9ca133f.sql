-- Add unique constraint to prevent double-booking
ALTER TABLE public.appointments 
ADD CONSTRAINT appointments_unique_time_slot 
UNIQUE (scheduled_date, start_time);