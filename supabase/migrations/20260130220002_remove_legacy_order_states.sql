-- Phase 5: Tighten CHECK constraint to only new statuses
DO $$
DECLARE
  legacy_count INTEGER;
BEGIN
  SELECT count(*) INTO legacy_count
  FROM orders
  WHERE status IN ('pending', 'pending_confirmation', 'confirmed', 'rejected', 'in_production', 'in_shipping');

  IF legacy_count > 0 THEN
    RAISE EXCEPTION 'Cannot remove legacy states: % orders still in legacy states', legacy_count;
  END IF;
END $$;

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (
  status IN ('awaiting_payment', 'payment_confirmed', 'in_transit', 'delivered', 'cancelled')
);
