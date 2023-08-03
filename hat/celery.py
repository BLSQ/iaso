# django_celery/celery.py

import os
from celery import Celery, shared_task

from hat import settings


os.environ.setdefault("DJANGO_SETTINGS_MODULE", "hat.settings")
app = Celery("iaso_celery")
app.config_from_object("django.conf:settings", namespace="CELERY")

app.conf.update(timezone = 'Europe/Rome')
# Celery Beat Settings
app.autodiscover_tasks(lambda: settings.INSTALLED_APPS, force=False) 