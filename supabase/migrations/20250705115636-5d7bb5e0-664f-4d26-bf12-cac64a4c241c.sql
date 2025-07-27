-- Add amount_paid column to bills table to track partial payments
ALTER TABLE public.bills ADD COLUMN amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Update existing bills to set amount_paid based on is_paid status
UPDATE public.bills SET amount_paid = amount WHERE is_paid = true;

-- Create or replace a function to calculate payment status
CREATE OR REPLACE FUNCTION get_payment_status(bill_amount DECIMAL, amount_paid DECIMAL)
RETURNS TEXT AS $$
BEGIN
  IF amount_paid = 0 THEN
    RETURN 'unpaid';
  ELSIF amount_paid >= bill_amount THEN
    RETURN 'fully_paid';
  ELSE
    RETURN 'partially_paid';
  END IF;
END;
$$ LANGUAGE plpgsql;