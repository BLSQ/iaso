import importlib

from django.conf import settings


def _plugin_settings_modules():
    for plugin_name in getattr(settings, "PLUGINS", []):
        try:
            yield importlib.import_module(f"plugins.{plugin_name}.plugin_settings")
        except ModuleNotFoundError:
            continue


def extra_org_unit_permissions(user):
    """Booleans from plugins that may also grant access to an org unit."""
    granted = []
    for plugin_settings in _plugin_settings_modules():
        contributor = getattr(plugin_settings, "org_unit_extra_permissions", None)
        if contributor is not None:
            granted.extend(contributor(user))
    return granted


def plugin_log_access(user, obj):
    """Ask plugins whether this user can read the audit log of obj.

    A plugin returns True or False when the object is one of its models, and None otherwise.
    """
    for plugin_settings in _plugin_settings_modules():
        checker = getattr(plugin_settings, "has_log_access", None)
        if checker is None:
            continue
        access = checker(user, obj)
        if access is not None:
            return access
    return None


def is_polio_plugin_active():
    return "polio" in settings.PLUGINS


def is_trypelim_plugin_active():
    return "trypelim" in settings.PLUGINS


def is_wfp_plugin_active():
    return "wfp" in settings.PLUGINS


def is_saas_plugin_active():
    return "saas" in settings.PLUGINS


def is_snt_malaria_plugin_active():
    return "snt_malaria" in settings.PLUGINS


def is_registry_plugin_active():
    return "registry" in settings.PLUGINS
