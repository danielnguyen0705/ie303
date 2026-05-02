BEGIN;

ALTER TABLE payment_transactions
    DROP CONSTRAINT IF EXISTS payment_transactions_provider_check;

ALTER TABLE payment_transactions
    ADD CONSTRAINT payment_transactions_provider_check
        CHECK (provider IN ('MOCK', 'VNPAY', 'MOMO', 'BANK'));

COMMIT;

