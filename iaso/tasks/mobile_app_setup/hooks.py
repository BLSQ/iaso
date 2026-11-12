"""Extension points of the export, for plugins.

A payload transformer changes an API response in place, just before it's saved in the zip (after its file URLs
were rewritten): `transform(filename, payload, options)`, where `filename` is the `ApiCall.filename` of the call
(e.g. "entities") and `options` the export options of the task.

Plugins register their transformers in their `AppConfig.ready()`.

    from iaso.tasks.mobile_app_setup.hooks import register_payload_transformer

    class TrypelimConfig(AppConfig):
        def ready(self):
            register_payload_transformer(modify_result_for_trypelim)
"""

from typing import Any, Callable


PayloadTransformer = Callable[[str, Any, dict], None]

payload_transformers: list[PayloadTransformer] = []


def register_payload_transformer(transform: PayloadTransformer):
    if transform not in payload_transformers:
        payload_transformers.append(transform)
