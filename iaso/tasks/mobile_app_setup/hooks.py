"""Hooks for plugins to change the API responses saved in the mobile app setup export.

Plugins register a factory method with `register_payload_transformer_factory()`, in their `AppConfig.ready()`.

The factory, `make_transformer(project, options)`, is called once at the start of each export and returns a
transformer that runs on every response before it is written to the zip.
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
