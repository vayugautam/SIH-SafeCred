from celery import Celery
from app.core.config import settings

# Initialize Celery explicitly pointing to Redis for both broker and backend (required for chords)
celery_app = Celery(
    "safecred_tasks",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.tasks.rescore_tasks"]
)

# Hardened Financial Configuration
celery_app.conf.update(
    task_acks_late=True,                 # Don't ack until task fully completes successfully
    task_reject_on_worker_lost=True,     # Requeue if worker node dies mid-execution
    worker_prefetch_multiplier=1,        # Prevents one fast worker from hoarding long tasks
    task_default_rate_limit="500/m",     # Protect backend from bulk stampedes
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

# Optional Periodic Schedule
celery_app.conf.beat_schedule = {
    "rescore-stale-monthly": {
        "task": "app.tasks.rescore_tasks.rescore_stale_periodic",
        "schedule": 2592000.0, # Every 30 days (simplified cron for snippet)
    }
}
