-- Phase 5: Create review_reminders table and trigger
CREATE TABLE IF NOT EXISTS review_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id),
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_review_reminders_order_id ON review_reminders(order_id);
CREATE INDEX IF NOT EXISTS idx_review_reminders_scheduled ON review_reminders(scheduled_at) WHERE sent_at IS NULL;

ALTER TABLE review_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins have full access to review reminders"
  ON review_reminders FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'superadmin'
    )
  );

-- Trigger: when order becomes 'delivered', schedule review reminder 7 days later
CREATE OR REPLACE FUNCTION handle_order_delivered_review_reminder()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status <> 'delivered') THEN
    INSERT INTO review_reminders (order_id, buyer_id, scheduled_at)
    VALUES (NEW.id, NEW.buyer_id, now() + interval '7 days')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_delivered_review_reminder ON orders;
CREATE TRIGGER trg_order_delivered_review_reminder
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION handle_order_delivered_review_reminder();
