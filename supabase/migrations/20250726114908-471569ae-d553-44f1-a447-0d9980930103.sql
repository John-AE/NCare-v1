-- Remove all bill adjustment and void functionality
-- Delete all bill adjustments first
DELETE FROM bill_adjustments;

-- Drop the bill_adjustments table completely
DROP TABLE IF EXISTS bill_adjustments;

-- Remove any adjusted or voided bills (those with amount = 0 or with adjustment history)
-- First, delete bill items for bills that might be voided/adjusted
DELETE FROM bill_items WHERE bill_id IN (
  SELECT id FROM bills WHERE amount = 0 OR description LIKE '%adjust%' OR description LIKE '%void%'
);

-- Delete payment history for adjusted/voided bills
DELETE FROM payment_history WHERE bill_id IN (
  SELECT id FROM bills WHERE amount = 0 OR description LIKE '%adjust%' OR description LIKE '%void%'
);

-- Delete the adjusted/voided bills themselves
DELETE FROM bills WHERE amount = 0 OR description LIKE '%adjust%' OR description LIKE '%void%';