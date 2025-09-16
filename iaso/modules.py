from dataclasses import dataclass, field


@dataclass
class IasoModule:
    """
    Represents a module in the IASO system.
    """

    name: str
    codename: str
    fr_name: str
    permissions: list = field(default_factory=list)

    def add_permission(self, permission):
        self.permissions.append(permission)

    def __str__(self):
        return self.codename


# Add here any new module - it must start with MODULE_ prefix
MODULE_DATA_COLLECTION = IasoModule(
    name="Data collection - Forms", codename="DATA_COLLECTION_FORMS", fr_name="Collecte de données - Formulaires"
)
MODULE_DEFAULT = IasoModule(name="Default", codename="DEFAULT", fr_name="Par défaut")
MODULE_DHIS2_MAPPING = IasoModule(name="DHIS2 mapping", codename="DHIS2_MAPPING", fr_name="Mappage DHIS2")
MODULE_EMBEDDED_LINKS = IasoModule(name="Embedded links", codename="EMBEDDED_LINKS", fr_name="Liens intégrés")
MODULE_ENTITIES = IasoModule(name="Entities", codename="ENTITIES", fr_name="Entités")
MODULE_EXTERNAL_STORAGE = IasoModule(name="External storage", codename="EXTERNAL_STORAGE", fr_name="Stockage externe")
MODULE_PLANNING = IasoModule(name="Planning", codename="PLANNING", fr_name="Planification")
MODULE_POLIO_PROJECT = IasoModule(name="Polio project", codename="POLIO_PROJECT", fr_name="Projet Polio")
MODULE_REGISTRY = IasoModule(name="Registry", codename="REGISTRY", fr_name="Registre")
MODULE_PAYMENTS = IasoModule(name="Payments", codename="PAYMENTS", fr_name="Paiements")
MODULE_COMPLETENESS_PER_PERIOD = IasoModule(
    name="Completeness per Period", codename="COMPLETENESS_PER_PERIOD", fr_name="Complétude par période"
)
MODULE_TRYPELIM_PROJECT = IasoModule(name="Trypelim project", codename="TRYPELIM_PROJECT", fr_name="Projet Trypelim")
MODULE_DATA_VALIDATION = IasoModule(
    name="Data validation", codename="DATA_VALIDATION", fr_name="Validation des données"
)

MODULES = [module for name, module in globals().items() if name.startswith("MODULE_")]
