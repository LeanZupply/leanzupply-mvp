-- Phase 1B: Migrate existing orders to new state model
-- pending, pending_confirmation, confirmed (unpaid) → awaiting_payment
-- confirmed (paid), in_production → payment_confirmed
-- in_shipping → in_transit
-- rejected → cancelled
-- delivered stays, cancelled stays

DO $$
DECLARE
  r RECORD;
  new_status TEXT;
BEGIN
  FOR r IN
    SELECT id, status, payment_status
    FROM orders
    WHERE status IN ('pending', 'pending_confirmation', 'confirmed', 'rejected', 'in_production', 'in_shipping')
  LOOP
    CASE r.status
      WHEN 'pending' THEN
        new_status := 'awaiting_payment';
      WHEN 'pending_confirmation' THEN
        new_status := 'awaiting_payment';
      WHEN 'confirmed' THEN
        IF r.payment_status = 'paid' THEN
          new_status := 'payment_confirmed';
        ELSE
          new_status := 'awaiting_payment';
        END IF;
      WHEN 'in_production' THEN
        new_status := 'payment_confirmed';
      WHEN 'in_shipping' THEN
        new_status := 'in_transit';
      WHEN 'rejected' THEN
        new_status := 'cancelled';
      ELSE
        new_status := r.status;
    END CASE;

    UPDATE orders SET status = new_status WHERE id = r.id;

    INSERT INTO order_activity_log (order_id, action, old_state, new_state, message, metadata)
    VALUES (
      r.id,
      'status_migrated',
      r.status,
      new_status,
      'Estado migrado automáticamente al nuevo modelo de estados',
      jsonb_build_object('migration', 'order_management_overhaul', 'original_payment_status', r.payment_status)
    );
  END LOOP;
END $$;
