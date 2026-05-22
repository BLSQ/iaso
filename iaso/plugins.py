from django.conf import settings


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
