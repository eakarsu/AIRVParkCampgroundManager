# Governed campground fulfillment operations

## Intended use and limits

The governed API supports availability, reservations, pricing, payment/refund proposals, consented guest communications, and reconciliation. It must not double-book, silently change a quoted price, send an unapproved message, or treat a modeled forecast as confirmed inventory. Operators remain responsible for exceptions and manual recovery.

## Data and integrations

Signed tenant/role claims, inventory versions, price breakdowns, consent, independent approval, and immutable events are required. Payment, tax, inventory, scheduling, messaging, accounting, delivery, and PMS requests enter a typed approval-gated outbox with idempotency, leases, bounded retries, and dead letters.

## Deploy, rollback, and recovery

Run `./start.sh check`, back up PostgreSQL, then use `ALLOW_SCHEMA_MIGRATION=1 ./start.sh migrate`. Roll back code without dropping additive workflow tables. Reconcile payment and booking receipts before replay; send ambiguous cases to a manual queue. Alert on version conflicts, overlapping reservations, payment mismatches, absent consent, self-approval, and dead letters.
