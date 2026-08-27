from dataclasses import dataclass, field
from typing import Optional

from django.utils.translation import gettext_lazy as _
from django_stubs_ext import StrOrPromise


@dataclass
class IasoModule:
    """
    Represents a module in the IASO system.
    """

    name: StrOrPromise
    codename: str
    permissions: list = field(default_factory=list)
    related_plugin: Optional[str] = None

    def add_permission(self, permission):
        self.permissions.append(permission)

    def __str__(self):
        return self.codename


# Add here any new module - it must start with MODULE_ prefix
MODULE_DATA_COLLECTION = IasoModule(name=_("Data collection - Forms"), codename="DATA_COLLECTION_FORMS")
MODULE_DEFAULT = IasoModule(name=_("Default"), codename="DEFAULT")
MODULE_DHIS2_MAPPING = IasoModule(name=_("DHIS2 mapping"), codename="DHIS2_MAPPING")
MODULE_EMBEDDED_LINKS = IasoModule(name=_("Embedded links"), codename="EMBEDDED_LINKS")
MODULE_ENTITIES = IasoModule(name=_("Entities"), codename="ENTITIES")
MODULE_EXTERNAL_STORAGE = IasoModule(name=_("External storage"), codename="EXTERNAL_STORAGE")
MODULE_PLANNING = IasoModule(name=_("Planning"), codename="PLANNING")
MODULE_POLIO_PROJECT = IasoModule(name=_("Polio project"), codename="POLIO_PROJECT", related_plugin="polio")
MODULE_REGISTRY = IasoModule(name=_("Registry"), codename="REGISTRY", related_plugin="registry")
MODULE_PAYMENTS = IasoModule(name=_("Payments"), codename="PAYMENTS")
MODULE_COMPLETENESS_PER_PERIOD = IasoModule(name=_("Completeness per Period"), codename="COMPLETENESS_PER_PERIOD")
MODULE_TRYPELIM_PROJECT = IasoModule(name=_("Trypelim project"), codename="TRYPELIM_PROJECT", related_plugin="trypelim")
MODULE_CHANGE_REQUESTS = IasoModule(name=_("Change requests"), codename="DATA_VALIDATION")
MODULE_SAAS = IasoModule(name=_("SaaS"), codename="SAAS", related_plugin="saas")
MODULE_STOCK = IasoModule(name=_("Stock management"), codename="STOCK_MANAGEMENT")
MODULE_SNT_MALARIA = IasoModule(name=_("SNT Malaria"), codename="SNT_MALARIA", related_plugin="snt_malaria")
MODULE_FORM_AI = IasoModule(name=_("Form AI"), codename="FORM_AI")
MODULE_VALIDATION_WORKFLOW = IasoModule(name=_("Validation workflow"), codename="VALIDATION_WORKFLOW")

MODULES = [
    module for name, module in globals().items() if name.startswith("MODULE_") and isinstance(module, IasoModule)
]
