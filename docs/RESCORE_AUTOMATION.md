# Rescore Automation Scheduler

This scheduler keeps borrower risk scores fresh by calling the admin re-score endpoint on a fixed cadence.

## Prerequisites

- The Next.js admin app must be running and reachable (default: `http://localhost:3002`).
- Environment variables below must be configured in `app/.env` (or exported before running the scheduler):

```env
# Shared secret that both the scheduler and API route agree on
RESCORE_CRON_TOKEN=change-me

# Optional overrides
RESCORE_CRON_ENDPOINT=http://localhost:3002/api/admin/rescore
RESCORE_CRON_EXPRESSION=0 3 * * *           # Every day at 03:00 server time
RESCORE_CRON_TZ=Asia/Kolkata                # Cron timezone
RESCORE_CRON_STATUSES=PROCESSING,MANUAL_REVIEW
RESCORE_CRON_LIMIT=50                       # Up to 100
RESCORE_CRON_STALE_ONLY=true                # Only re-score stale applications
RESCORE_CRON_RUN_ON_START=true              # Kick off immediately on boot
RESCORE_CRON_ACTOR_ID=00000000-0000-0000-0000-000000000000  # Optional audit actor
```

> **Note:** `RESCORE_CRON_TOKEN` is required. All other values have safe defaults.

## Running the Scheduler

Install dependencies (once):

```powershell
cd app
npm install
```

Start the scheduler:

```powershell
npm run rescore:scheduler
```

The process logs each run and reports any failed applications. The scheduler respects `SIGINT`/`SIGTERM`, so standard process managers (PM2, systemd, Windows Task Scheduler) can supervise it easily.

## How It Works

1. `scripts/rescore-cron.ts` schedules a job using `node-cron`.
2. Each run sends a POST request to `/api/admin/rescore` with the shared `x-safecred-cron-token` header.
3. The API route recognises the token, applies default filters (`PROCESSING`/`MANUAL_REVIEW`, stale > 24h, limit 50), and records audit logs tagged as `scheduler`.

## Extending the Workflow

- **Custom Cohorts:** Set `RESCORE_CRON_STATUSES` or pass `applicationIds` inside the script for targeted batches.
- **Multiple Cadences:** Run additional scheduler processes with different cron expressions (e.g., nightly full run + hourly quick refresh).
- **Partner Ingestion:** Pair this scheduler with upstream jobs that call `/api/admin/partner-ingest` so new partner data is always scored within the next window.

For visual monitoring, augment the Admin Analytics dashboard to display scheduler activity (success/failure counts, last run timestamp) pulled from `audit_logs`.
