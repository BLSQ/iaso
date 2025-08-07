from importlib import import_module
from types import ModuleType

from django.conf import settings


MODULE_PERMISSIONS = {}

MODULES = [
    {
        "name": "Data collection - Forms",
        "codename": "DATA_COLLECTION_FORMS",
        "fr_name": "Collecte de données - Formulaires",
    },
    {"name": "Default", "codename": "DEFAULT", "fr_name": "Par défaut"},
    {"name": "DHIS2 mapping", "codename": "DHIS2_MAPPING", "fr_name": "Mappage DHIS2"},
    {
        "name": "Embedded links",
        "codename": "EMBEDDED_LINKS",
        "fr_name": "Liens intégrés",
    },
    {"name": "Entities", "codename": "ENTITIES", "fr_name": "Entités"},
    {
        "name": "External storage",
        "codename": "EXTERNAL_STORAGE",
        "fr_name": "Stockage externe",
    },
    {"name": "Planning", "codename": "PLANNING", "fr_name": "Planification"},
    {
        "name": "Polio project",
        "codename": "POLIO_PROJECT",
        "fr_name": "Projet Polio",
    },  # can't be extracted yet because it generates migrations
    {"name": "Registry", "codename": "REGISTRY", "fr_name": "Registre"},
    {"name": "Payments", "codename": "PAYMENTS", "fr_name": "Paiements"},
    {
        "name": "Completeness per Period",
        "codename": "COMPLETENESS_PER_PERIOD",
        "fr_name": "Complétude par période",
    },
    {
        "name": "Trypelim project",
        "codename": "TRYPELIM_PROJECT",
        "fr_name": "Projet Trypelim",
    },
    {
        "name": "Data validation",
        "codename": "DATA_VALIDATION",
        "fr_name": "Validation des données",
    },
]

FEATUREFLAGES_TO_EXCLUDE = {
    "PLANNING": ["PLANNING"],
    "ENTITIES": [
        "REPORTS",
        "ENTITY",
        "MOBILE_ENTITY_WARN_WHEN_FOUND",
        "MOBILE_ENTITY_LIMITED_SEARCH",
        "MOBILE_ENTITY_NO_CREATION",
        "WRITE_ON_NFC_CARDS",
    ],
}

DEFAULT_ACCOUNT_FEATURE_FLAGS = [
    "SHOW_PAGES",
    "SHOW_BENEFICIARY_TYPES_IN_LIST_MENU",
    "SHOW_LINK_INSTANCE_REFERENCE",
    "SHOW_HOME_ONLINE",
]

PERMISSIONS_PRESENTATION = {}

READ_EDIT_PERMISSIONS = {}


def load_permissions_from_permissions_module(permissions_module: ModuleType):
    read_edit_permissions = permissions_module.read_edit_permissions
    permissions_presentation = permissions_module.permissions_presentation
    module_permissions = permissions_module.module_permissions

    global READ_EDIT_PERMISSIONS, PERMISSIONS_PRESENTATION, MODULE_PERMISSIONS
    READ_EDIT_PERMISSIONS.update(read_edit_permissions)
    PERMISSIONS_PRESENTATION.update(permissions_presentation)
    MODULE_PERMISSIONS.update(module_permissions)


# load stuff from core
core_permissions = import_module("iaso.permissions")
load_permissions_from_permissions_module(core_permissions)

for plugin in settings.PLUGINS:
    try:
        plugin_permissions = import_module(f"plugins.{plugin}.permissions")
        load_permissions_from_permissions_module(plugin_permissions)
    except ImportError:
        print(f"{plugin} plugin has no permission support")
