"""Resolve the named URL pattern for `/` (plugins may override via ``plugins.<name>.plugin_settings``)."""

import importlib

from django.conf import settings


def resolve_root_redirect_pattern_name() -> str:
    """
    Start from ``ROOT_REDIRECT_PATTERN_NAME`` (env or tests via ``override_settings``), then apply
    optional hooks from ``plugins.<name>.plugin_settings.ROOT_REDIRECT_PATTERN_NAME`` when that module exists.
    If several plugins define it, the last entry in ``PLUGINS`` wins (same idea as the web UI plugin order).
    """
    pattern_name = settings.ROOT_REDIRECT_PATTERN_NAME
    for plugin_name in settings.PLUGINS:
        plugin_name = (plugin_name or "").strip()
        if not plugin_name:
            continue
        module_name = f"plugins.{plugin_name}.plugin_settings"
        try:
            plugin_settings_mod = importlib.import_module(module_name)
        except ModuleNotFoundError as error:
            if error.name == module_name:
                continue
            raise

        plugin_pattern = getattr(plugin_settings_mod, "ROOT_REDIRECT_PATTERN_NAME", None)
        if plugin_pattern:
            pattern_name = plugin_pattern
    return pattern_name
