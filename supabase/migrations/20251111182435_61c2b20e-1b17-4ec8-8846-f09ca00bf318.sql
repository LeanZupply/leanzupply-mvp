-- Add 'paused' as a valid status for products
-- First, check if there's a constraint on the status field
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_status_check;

-- Add a new constraint that includes 'paused'
ALTER TABLE products ADD CONSTRAINT products_status_check 
CHECK (status IN ('pending', 'active', 'rejected', 'paused'));

-- Update any existing comment to reflect the new valid values
COMMENT ON COLUMN products.status IS 'Valid values: pending, active, rejected, paused';