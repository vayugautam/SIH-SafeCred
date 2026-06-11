-- Requires pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule job to purge records older than 24 months
-- Complies with IT Act 2000 and PDPB 2023 data minimisation requirements
SELECT cron.schedule(
    'purge_old_consumption_records',
    '0 3 1 * *', -- At 03:00 on day-of-month 1
    $$ DELETE FROM consumption_records WHERE created_at < NOW() - INTERVAL '24 months' $$
);

-- Note: Financial compliance generally requires 5-year retention for actual loan ledgers and audits
SELECT cron.schedule(
    'purge_old_audit_logs',
    '0 4 1 * *', -- At 04:00 on day-of-month 1
    $$ DELETE FROM audit_trail WHERE created_at < NOW() - INTERVAL '60 months' $$
);
