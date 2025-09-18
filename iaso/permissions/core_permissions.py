from dataclasses import dataclass

from django.db import models
from django.utils.translation import gettext_lazy as _

from iaso.modules import (
    MODULE_COMPLETENESS_PER_PERIOD,
    MODULE_DATA_COLLECTION,
    MODULE_DATA_VALIDATION,
    MODULE_DEFAULT,
    MODULE_DHIS2_MAPPING,
    MODULE_EMBEDDED_LINKS,
    MODULE_ENTITIES,
    MODULE_EXTERNAL_STORAGE,
    MODULE_PAYMENTS,
    MODULE_PLANNING,
    MODULE_REGISTRY,
)
from iaso.permissions.base import IasoPermission


@dataclass
class CorePermission(IasoPermission):
    """
    Represents a core IASO permission.
    """

    def full_name(self) -> str:
        return f"iaso.{self.codename}"


# Groups displayed in the web interface
PERMISSION_GROUP_ORG_UNITS = "org_units"
PERMISSION_GROUP_PLANNING = "planning"
PERMISSION_GROUP_FORMS = "forms"
PERMISSION_GROUP_ADMIN = "admin"
PERMISSION_GROUP_ENTITIES = "entities"
PERMISSION_GROUP_DHIS2_MAPPING = "dhis2_mapping"
PERMISSION_GROUP_DATA_VALIDATION = "data_validation"
PERMISSION_GROUP_EMBEDDED_LINKS = "embedded_links"
PERMISSION_GROUP_PAYMENTS = "payments"
PERMISSION_GROUP_REGISTRY = "registry"
PERMISSION_GROUP_EXTERNAL_STORAGE = "external_storage"
PERMISSION_GROUPS_DISPLAY_ORDER = [
    PERMISSION_GROUP_FORMS,
    PERMISSION_GROUP_ORG_UNITS,
    PERMISSION_GROUP_DATA_VALIDATION,
    PERMISSION_GROUP_REGISTRY,
    PERMISSION_GROUP_ENTITIES,
    PERMISSION_GROUP_DHIS2_MAPPING,
    PERMISSION_GROUP_EXTERNAL_STORAGE,
    PERMISSION_GROUP_PLANNING,
    PERMISSION_GROUP_EMBEDDED_LINKS,
    PERMISSION_GROUP_ADMIN,
]


# Add here any new core permission - it must start with the "CORE_" prefix and end with "_PERMISSION"
CORE_ASSIGNMENTS_PERMISSION = CorePermission(
    codename="iaso_assignments", label=_("Attributions"), module=MODULE_PLANNING, ui_group=PERMISSION_GROUP_PLANNING
)
CORE_COMPLETENESS_PERMISSION = CorePermission(
    codename="iaso_completeness",
    label=_("Complétude des données"),
    module=MODULE_COMPLETENESS_PER_PERIOD,
    ui_group=PERMISSION_GROUP_FORMS,
)
CORE_COMPLETENESS_STATS_PERMISSION = CorePermission(
    codename="iaso_completeness_stats",
    label=_("Completeness stats"),
    module=MODULE_DATA_COLLECTION,
    ui_group=PERMISSION_GROUP_FORMS,
)
CORE_DATASTORE_READ_PERMISSION = CorePermission(
    codename="iaso_datastore_read",
    label=_("Read data store"),
    ui_category="datastore",
    ui_type_in_category="read",
    ui_order_in_category=1,
)
CORE_DATASTORE_WRITE_PERMISSION = CorePermission(
    codename="iaso_datastore_write",
    label=_("Write data store"),
    ui_category="datastore",
    ui_type_in_category="write",
    ui_order_in_category=2,
)
CORE_DATA_TASKS_PERMISSION = CorePermission(
    codename="iaso_data_tasks", label=_("Tâches"), module=MODULE_DEFAULT, ui_group=PERMISSION_GROUP_ADMIN
)
CORE_ENTITIES_PERMISSION = CorePermission(
    codename="iaso_entities", label=_("Entities"), module=MODULE_ENTITIES, ui_group=PERMISSION_GROUP_ENTITIES
)
CORE_ENTITY_TYPE_WRITE_PERMISSION = CorePermission(
    codename="iaso_entity_type_write",
    label=_("Write entity type"),
    module=MODULE_ENTITIES,
    ui_group=PERMISSION_GROUP_ENTITIES,
)
CORE_ENTITIES_DUPLICATES_READ_PERMISSION = CorePermission(
    codename="iaso_entity_duplicates_read",
    label=_("Read Entity duplicates"),
    module=MODULE_ENTITIES,
    ui_group=PERMISSION_GROUP_ENTITIES,
    ui_category="iaso_entity_duplicate_permissions",
    ui_type_in_category="read",
    ui_order_in_category=1,
)
CORE_ENTITIES_DUPLICATES_WRITE_PERMISSION = CorePermission(
    codename="iaso_entity_duplicates_write",
    label=_("Write Entity duplicates"),
    module=MODULE_ENTITIES,
    ui_group=PERMISSION_GROUP_ENTITIES,
    ui_category="iaso_entity_duplicate_permissions",
    ui_type_in_category="write",
    ui_order_in_category=2,
)
CORE_FORMS_PERMISSION = CorePermission(
    codename="iaso_forms", label=_("Formulaires"), module=MODULE_DATA_COLLECTION, ui_group=PERMISSION_GROUP_FORMS
)
CORE_FORMS_STATS_PERMISSION = CorePermission(
    codename="iaso_forms_stats",
    label=_("Statistiques pour les formulaires"),
    module=MODULE_DATA_COLLECTION,
    ui_group=PERMISSION_GROUP_FORMS,
)
CORE_LINKS_PERMISSION = CorePermission(
    codename="iaso_links", label=_("Correspondances sources"), module=MODULE_DEFAULT, ui_group=PERMISSION_GROUP_ADMIN
)
CORE_MAPPINGS_PERMISSION = CorePermission(
    codename="iaso_mappings",
    label=_("Correspondances avec DHIS2"),
    module=MODULE_DHIS2_MAPPING,
    ui_group=PERMISSION_GROUP_DHIS2_MAPPING,
)
CORE_MOBILE_APP_OFFLINE_SETUP_PERMISSION = CorePermission(
    codename="iaso_mobile_app_offline_setup",
    label=_("Mobile app offline setup"),
    module=MODULE_DEFAULT,
    ui_group=PERMISSION_GROUP_ADMIN,
)
CORE_MODULES_PERMISSION = CorePermission(
    codename="iaso_modules", label=_("modules"), module=MODULE_DEFAULT, ui_group=PERMISSION_GROUP_ADMIN
)
CORE_ORG_UNITS_PERMISSION = CorePermission(
    codename="iaso_org_units",
    label=_("Unités d'organisations"),
    module=MODULE_DEFAULT,
    ui_group=PERMISSION_GROUP_ORG_UNITS,
    ui_category="iaso_org_unit_permissions",
    ui_type_in_category="write",
    ui_order_in_category=2,
)
CORE_ORG_UNITS_HISTORY_PERMISSION = CorePermission(
    codename="iaso_org_units_history",
    label=_("Historique des unités d'organisation"),
    module=MODULE_DEFAULT,
    ui_group=PERMISSION_GROUP_ORG_UNITS,
)
CORE_ORG_UNITS_READ_PERMISSION = CorePermission(
    codename="iaso_org_units_read",
    label=_("Lire les unités d'organisations"),
    module=MODULE_DEFAULT,
    ui_group=PERMISSION_GROUP_ORG_UNITS,
    ui_category="iaso_org_unit_permissions",
    ui_type_in_category="read",
    ui_order_in_category=1,
)
CORE_ORG_UNITS_TYPES_PERMISSION = CorePermission(
    codename="iaso_org_unit_types",
    label=_("Org unit types"),
    module=MODULE_DEFAULT,
    ui_group=PERMISSION_GROUP_ORG_UNITS,
)
CORE_ORG_UNIT_GROUPS_PERMISSION = CorePermission(
    codename="iaso_org_unit_groups",
    label=_("Org unit groups"),
    module=MODULE_DEFAULT,
    ui_group=PERMISSION_GROUP_ORG_UNITS,
)
CORE_ORG_UNITS_CHANGE_REQUEST_REVIEW_PERMISSION = CorePermission(
    codename="iaso_org_unit_change_request_review",
    label=_("Org unit change request review"),
    module=MODULE_DATA_VALIDATION,
    ui_group=PERMISSION_GROUP_DATA_VALIDATION,
)
CORE_ORG_UNITS_CHANGE_REQUEST_CONFIGURATIONS_PERMISSION = CorePermission(
    codename="iaso_org_unit_change_request_configurations",
    label=_("Org unit change request configurations"),
    module=MODULE_DATA_VALIDATION,
    ui_group=PERMISSION_GROUP_DATA_VALIDATION,
)
CORE_PAGES_PERMISSION = CorePermission(
    codename="iaso_pages",
    label=_("Pages"),
    module=MODULE_EMBEDDED_LINKS,
    ui_group=PERMISSION_GROUP_EMBEDDED_LINKS,
    ui_category="iaso_page_permissions",
    ui_type_in_category="read",
    ui_order_in_category=1,
)
CORE_PAGE_WRITE_PERMISSION = CorePermission(
    codename="iaso_page_write",
    label=_("Write page"),
    module=MODULE_EMBEDDED_LINKS,
    ui_group=PERMISSION_GROUP_EMBEDDED_LINKS,
    ui_category="iaso_page_permissions",
    ui_type_in_category="write",
    ui_order_in_category=2,
)
CORE_PAYMENTS_PERMISSION = CorePermission(
    codename="iaso_payments", label=_("Payments page"), module=MODULE_PAYMENTS, ui_group=PERMISSION_GROUP_PAYMENTS
)
CORE_PLANNING_WRITE_PERMISSION = CorePermission(
    codename="iaso_planning_write",
    label=_("Editer le planning"),
    module=MODULE_PLANNING,
    ui_group=PERMISSION_GROUP_PLANNING,
    ui_category="iaso_planning_permissions",
    ui_type_in_category="write",
    ui_order_in_category=2,
)
CORE_PLANNING_READ_PERMISSION = CorePermission(
    codename="iaso_planning_read",
    label=_("Lire le planning"),
    module=MODULE_PLANNING,
    ui_group=PERMISSION_GROUP_PLANNING,
    ui_category="iaso_planning_permissions",
    ui_type_in_category="read",
    ui_order_in_category=1,
)
CORE_PROJECTS_PERMISSION = CorePermission(
    codename="iaso_projects", label=_("Projets"), module=MODULE_DEFAULT, ui_group=PERMISSION_GROUP_ADMIN
)
CORE_REGISTRY_WRITE_PERMISSION = CorePermission(
    codename="iaso_registry_write",
    label=_("Editer le Registre"),
    module=MODULE_REGISTRY,
    ui_group=PERMISSION_GROUP_REGISTRY,
    ui_category="iaso_registry_permissions",
    ui_type_in_category="write",
    ui_order_in_category=2,
)
CORE_REGISTRY_READ_PERMISSION = CorePermission(
    codename="iaso_registry_read",
    label=_("Lire le Registre"),
    module=MODULE_REGISTRY,
    ui_group=PERMISSION_GROUP_REGISTRY,
    ui_category="iaso_registry_permissions",
    ui_type_in_category="read",
    ui_order_in_category=1,
)
CORE_REPORTS_PERMISSION = CorePermission(
    codename="iaso_reports", label=_("Reports"), module=MODULE_DEFAULT, ui_group=PERMISSION_GROUP_ADMIN
)
CORE_SOURCE_WRITE_PERMISSION = CorePermission(
    codename="iaso_write_sources",
    label=_("Write data source"),
    module=MODULE_DEFAULT,
    ui_group=PERMISSION_GROUP_ADMIN,
    ui_category="iaso_source_permissions",
    ui_type_in_category="write",
    ui_order_in_category=2,
)
CORE_SOURCE_PERMISSION = CorePermission(
    codename="iaso_sources",
    label=_("Sources"),
    module=MODULE_DEFAULT,
    ui_group=PERMISSION_GROUP_ADMIN,
    ui_category="iaso_source_permissions",
    ui_type_in_category="read",
    ui_order_in_category=1,
)
CORE_SOURCE_CAN_CHANGE_DEFAULT_VERSION_PERMISSION = CorePermission(
    codename="iaso_sources_can_change_default_version",
    label=_("Can change the default version of a data source"),
    module=MODULE_DEFAULT,
    ui_group=PERMISSION_GROUP_ADMIN,
)
CORE_STORAGE_PERMISSION = CorePermission(
    codename="iaso_storages",
    label=_("Storages"),
    module=MODULE_EXTERNAL_STORAGE,
    ui_group=PERMISSION_GROUP_EXTERNAL_STORAGE,
)
CORE_SUBMISSIONS_PERMISSION = CorePermission(
    codename="iaso_submissions",
    label=_("Soumissions"),
    module=MODULE_DATA_COLLECTION,
    ui_group=PERMISSION_GROUP_FORMS,
    ui_category="iaso_submission_permissions",
    ui_type_in_category="read",
    ui_order_in_category=1,
)
CORE_SUBMISSIONS_UPDATE_PERMISSION = CorePermission(
    codename="iaso_update_submission",
    label=_("Editer soumissions"),
    module=MODULE_DATA_COLLECTION,
    ui_group=PERMISSION_GROUP_FORMS,
    ui_category="iaso_submission_permissions",
    ui_type_in_category="write",
    ui_order_in_category=2,
)
CORE_TEAMS_PERMISSION = CorePermission(
    codename="iaso_teams", label=_("Equipes"), module=MODULE_DEFAULT, ui_group=PERMISSION_GROUP_ADMIN
)
CORE_USERS_ADMIN_PERMISSION = CorePermission(
    codename="iaso_users",
    label=_("Users"),
    module=MODULE_DEFAULT,
    ui_group=PERMISSION_GROUP_ADMIN,
    ui_category="iaso_user_permissions",
    ui_type_in_category="all",
    ui_order_in_category=2,
)
CORE_USERS_MANAGED_PERMISSION = CorePermission(
    codename="iaso_users_managed",
    label=_("Users managed"),
    module=MODULE_DEFAULT,
    ui_group=PERMISSION_GROUP_ADMIN,
    ui_category="iaso_user_permissions",
    ui_type_in_category="geo_limited",
    ui_order_in_category=1,
)
CORE_USERS_ROLES_PERMISSION = CorePermission(
    codename="iaso_user_roles", label=_("Manage user roles"), module=MODULE_DEFAULT, ui_group=PERMISSION_GROUP_ADMIN
)
CORE_WORKFLOW_PERMISSION = CorePermission(
    codename="iaso_workflows", label=_("Workflows"), module=MODULE_ENTITIES, ui_group=PERMISSION_GROUP_ENTITIES
)


permissions = {
    perm.codename: perm
    for variable_name, perm in globals().items()
    if variable_name.startswith("CORE_") and variable_name.endswith("_PERMISSION") and isinstance(perm, CorePermission)
}


class CorePermissionSupport(models.Model):
    class Meta:
        managed = False
        default_permissions = []
        permissions = [perm.model_permission() for perm in permissions.values()]


permission_models = [CorePermissionSupport]
