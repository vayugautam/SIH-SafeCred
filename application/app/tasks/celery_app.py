import os
from celery import Celery
from celery.schedules import crontab

redis_url = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "safecred_tasks",
    broker=redis_url,
    backend=redis_url,
    include=[
        'app.tasks.rescore_task',
        'app.tasks.ingestion_tasks',
        'app.tasks.data_sync'
    ]
)

# Apply specific config constraints
celery_app.conf.update(
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    task_default_rate_limit="500/m",
    result_expires=86400,
    timezone='Asia/Kolkata'
)

# Periodic Scheduling
celery_app.conf.beat_schedule = {
    'rescore-stale-monthly': {
        'task': 'app.tasks.rescore_task.rescore_stale_periodic',
        # Runs on the 1st of every month at 02:00 AM
        'schedule': crontab(day_of_month='1', hour=2, minute=0),
    },
    'nightly-secc-pmgdisha-sync': {
        'task': 'app.tasks.data_sync.sync_secc_pmgdisha_data',
        # Runs every night at 1:00 AM
        'schedule': crontab(hour=1, minute=0),
    }
}
