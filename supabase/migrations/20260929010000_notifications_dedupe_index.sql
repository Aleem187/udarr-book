-- Stripe delivers webhooks at-least-once, so the same checkout.session.completed
-- event can arrive twice. This makes re-processing a no-op per recipient+payment.
create unique index if not exists notifications_recipient_payment_uidx
  on notifications (recipient_id, related_payment_id)
  where related_payment_id is not null;
