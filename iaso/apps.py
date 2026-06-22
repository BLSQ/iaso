from django.apps import AppConfig

from iaso.plugins import is_saas_plugin_active


class IasoConfig(AppConfig):
    name = "iaso"

    def ready(self):
        from .auth import signals  # noqa: F401

        if is_saas_plugin_active():
            import iaso.saas  # noqa: F401
