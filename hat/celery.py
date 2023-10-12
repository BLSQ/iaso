from django.conf import settings

if settings.USE_CELERY:
    import os
    from celery import Celery, shared_task

    from hat import settings

    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "hat.settings")
    app = Celery("iaso_celery")
    app.config_from_object("django.conf:settings", namespace="CELERY")

    app.conf.update(timezone="Europe/Rome")
    app.conf.update(result_backend="django-db")
    app.conf.update(task_always_eager=True)
    app.conf.update(task_store_eager_result=True)

    # Celery Beat Settings
    app.autodiscover_tasks(lambda: settings.INSTALLED_APPS, force=False)
