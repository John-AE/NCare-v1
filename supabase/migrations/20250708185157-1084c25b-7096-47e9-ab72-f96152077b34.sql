-- Add payment_method column to bills table
ALTER TABLE public.bills ADD COLUMN payment_method TEXT;

-- Add a comment to describe the column
COMMENT ON COLUMN public.bills.payment_method IS 'Payment method used: cash, debit_card, or bank_transfer';