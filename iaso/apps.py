from django.apps import AppConfig


class IasoConfig(AppConfig):
    name = "iaso"

    def ready(self):
        from .auth import signals  # noqa: F401
        from .stack_dump import register_stack_dump_signal

        register_stack_dump_signal()
