from django.apps import AppConfig


class IasoConfig(AppConfig):
    name = "iaso"

    def ready(self):
        from .auth import signals  # noqa: F401
