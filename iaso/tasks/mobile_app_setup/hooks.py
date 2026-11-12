"""Extension points of the export, for plugins.

A plugin registers a payload transformer factory: `make_transformer(project, options)`. It's called once at the
start of every export, with the exported `Project` and the export options of the task. It returns either `None`
(nothing to change for this export) or a payload transformer.

A payload transformer, `transform(filename, payload)`, changes an API response in place, just before it's saved in
the zip (after its file URLs were rewritten). `filename` is the `ApiCall.filename` of the call (e.g. "entities").
It's called for every response, and every page of the paginated ones, so it should return early for the others.

The factory is where the per-export setup goes (DB queries, options): the transformer it returns is a closure over
that state, which lives as long as the export.

Plugins register their factories in their `AppConfig.ready()`.

    from iaso.tasks.mobile_app_setup.hooks import register_payload_transformer_factory

    class TrypelimConfig(AppConfig):
        def ready(self):
            register_payload_transformer_factory(make_entities_transformer)
"""

from typing import Any, Callable, Optional

from iaso.models import Project


PayloadTransformer = Callable[[str, Any], None]
PayloadTransformerFactory = Callable[[Project, dict], Optional[PayloadTransformer]]

payload_transformer_factories: list[PayloadTransformerFactory] = []


def register_payload_transformer_factory(make_transformer: PayloadTransformerFactory):
    if make_transformer not in payload_transformer_factories:
        payload_transformer_factories.append(make_transformer)


def make_payload_transformers(project: Project, options: dict) -> list[PayloadTransformer]:
    """Calls the registered factories for this export, and returns the transformers they made."""
    transformers = []
    for make_transformer in payload_transformer_factories:
        transform = make_transformer(project, options)
        if transform is not None:
            transformers.append(transform)
    return transformers
