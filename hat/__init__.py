from django.conf import settings

if settings.USE_CELERY:
    from .celery import app as celery_app

    __all__ = ("celery_app",)
