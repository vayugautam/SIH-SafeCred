-- Requires the pg_cron extension to be enabled on the PostgreSQL instance
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a background job to run daily at 02:00 AM
-- This strictly enforces the PDPB 2023 and IT Act 2000 data minimization policy
-- by hard-deleting consumption records older than 24 months.
SELECT cron.schedule(
    'purge_old_consumption_records',
    '0 2 * * *',
    $$ DELETE FROM consumption_records WHERE created_at < NOW() - INTERVAL '24 months' $$
);
