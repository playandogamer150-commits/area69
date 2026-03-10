from celery import Celery
from celery.signals import worker_init

from app.core.config import settings

celery_app = Celery(
    "modelclone",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=[
        "app.tasks.generation_tasks",
        "app.tasks.lora_tasks",
    ]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,
    task_soft_time_limit=3300,
    worker_prefetch_multiplier=1,
    broker_transport_options={"visibility_timeout": 3600},
    result_expires=86400,
)


@worker_init.connect
def init_worker(**kwargs):
    """Initialize worker."""
    pass
