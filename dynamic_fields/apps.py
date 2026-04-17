from django.apps import AppConfig


class DynamicFieldsConfig(AppConfig):
    name = "dynamic_fields"
    verbose_name = "Dynamic Fields"

    def ready(self):
        from . import config  # noqa

        super().ready()
