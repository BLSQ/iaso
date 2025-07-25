from django.db import models
from django.utils.translation import gettext_lazy as _


_PREFIX = "iaso."

_ASSIGNMENTS = "iaso_assignments"
_COMPLETENESS = "iaso_completeness"
_COMPLETENESS_STATS = "iaso_completeness_stats"
_DATASTORE_READ = "iaso_datastore_read"
_DATASTORE_WRITE = "iaso_datastore_write"
_DATA_TASKS = "iaso_data_tasks"
_ENTITIES = "iaso_entities"
_ENTITY_TYPE_WRITE = "iaso_entity_type_write"
_ENTITIES_DUPLICATE_READ = "iaso_entity_duplicates_read"
_ENTITIES_DUPLICATE_WRITE = "iaso_entity_duplicates_write"
_FORMS = "iaso_forms"
_FORMS_STATS = "iaso_forms_stats"
_LINKS = "iaso_links"
_MAPPINGS = "iaso_mappings"
_MOBILE_APP_OFFLINE_SETUP = "iaso_mobile_app_offline_setup"
_MODULES = "iaso_modules"
_ORG_UNITS = "iaso_org_units"
_ORG_UNITS_HISTORY = "iaso_org_units_history"
_ORG_UNITS_READ = "iaso_org_units_read"
_ORG_UNITS_TYPES = "iaso_org_unit_types"
_ORG_UNITS_GROUPS = "iaso_org_unit_groups"
_ORG_UNITS_CHANGE_REQUEST_REVIEW = "iaso_org_unit_change_request_review"
_ORG_UNITS_CHANGE_REQUEST_CONFIGURATIONS = "iaso_org_unit_change_request_configurations"
_PAGES = "iaso_pages"
_PAGE_WRITE = "iaso_page_write"
_PAYMENTS = "iaso_payments"
_PLANNING_WRITE = "iaso_planning_write"
_PLANNING_READ = "iaso_planning_read"
_PROJECTS = "iaso_projects"
_REGISTRY_WRITE = "iaso_registry_write"
_REGISTRY_READ = "iaso_registry_read"
_REPORTS = "iaso_reports"
_SOURCE_WRITE = "iaso_write_sources"
_SOURCES = "iaso_sources"
_SOURCES_CAN_CHANGE_DEFAULT_VERSION = "iaso_sources_can_change_default_version"
_STORAGE = "iaso_storages"
_SUBMISSIONS = "iaso_submissions"
_SUBMISSIONS_UPDATE = "iaso_update_submission"
_TEAMS = "iaso_teams"
_USERS_ADMIN = "iaso_users"
_USERS_MANAGED = "iaso_users_managed"
_USERS_ROLES = "iaso_user_roles"
_WORKFLOW = "iaso_workflows"

ASSIGNMENTS = _PREFIX + _ASSIGNMENTS
COMPLETENESS = _PREFIX + _COMPLETENESS
COMPLETENESS_STATS = _PREFIX + _COMPLETENESS_STATS
DATASTORE_READ = _PREFIX + _DATASTORE_READ
DATASTORE_WRITE = _PREFIX + _DATASTORE_WRITE
DATA_TASKS = _PREFIX + _DATA_TASKS
ENTITIES = _PREFIX + _ENTITIES
ENTITY_TYPE_WRITE = _PREFIX + _ENTITY_TYPE_WRITE
ENTITIES_DUPLICATE_READ = _PREFIX + _ENTITIES_DUPLICATE_READ
ENTITIES_DUPLICATE_WRITE = _PREFIX + _ENTITIES_DUPLICATE_WRITE
FORMS = _PREFIX + _FORMS
FORMS_STATS = _PREFIX + _FORMS_STATS
LINKS = _PREFIX + _LINKS
MAPPINGS = _PREFIX + _MAPPINGS
MOBILE_APP_OFFLINE_SETUP = _PREFIX + _MOBILE_APP_OFFLINE_SETUP
MODULES = _PREFIX + _MODULES
ORG_UNITS = _PREFIX + _ORG_UNITS
ORG_UNITS_HISTORY = _PREFIX + _ORG_UNITS_HISTORY
ORG_UNITS_READ = _PREFIX + _ORG_UNITS_READ
ORG_UNITS_TYPES = _PREFIX + _ORG_UNITS_TYPES
ORG_UNITS_GROUPS = _PREFIX + _ORG_UNITS_GROUPS
ORG_UNITS_CHANGE_REQUEST_REVIEW = _PREFIX + _ORG_UNITS_CHANGE_REQUEST_REVIEW
ORG_UNITS_CHANGE_REQUEST_CONFIGURATIONS = _PREFIX + _ORG_UNITS_CHANGE_REQUEST_CONFIGURATIONS
PAYMENTS = _PREFIX + _PAYMENTS
PAGES = _PREFIX + _PAGES
PAGE_WRITE = _PREFIX + _PAGE_WRITE
PLANNING_WRITE = _PREFIX + _PLANNING_WRITE
PLANNING_READ = _PREFIX + _PLANNING_READ
PROJECTS = _PREFIX + _PROJECTS
REGISTRY_WRITE = _PREFIX + _REGISTRY_WRITE
REGISTRY_READ = _PREFIX + _REGISTRY_READ
REPORTS = _PREFIX + _REPORTS
SOURCE_WRITE = _PREFIX + _SOURCE_WRITE
SOURCES = _PREFIX + _SOURCES
SOURCES_CAN_CHANGE_DEFAULT_VERSION = _PREFIX + _SOURCES_CAN_CHANGE_DEFAULT_VERSION
STORAGE = _PREFIX + _STORAGE
SUBMISSIONS = _PREFIX + _SUBMISSIONS
SUBMISSIONS_UPDATE = _PREFIX + _SUBMISSIONS_UPDATE
TEAMS = _PREFIX + _TEAMS
USERS_ADMIN = _PREFIX + _USERS_ADMIN
USERS_MANAGED = _PREFIX + _USERS_MANAGED
USERS_ROLES = _PREFIX + _USERS_ROLES
WORKFLOW = _PREFIX + _WORKFLOW


read_edit_permissions = {
    "iaso_org_unit_permissions": {
        "read": "iaso_org_units_read",
        "write": "iaso_org_units",
    },
    "iaso_registry_permissions": {
        "read": "iaso_registry_read",
        "write": "iaso_registry_write",
    },
    "iaso_source_permissions": {"read": "iaso_sources", "write": "iaso_write_sources"},
    "iaso_entity_duplicate_permissions": {
        "read": "iaso_entity_duplicates_read",
        "write": "iaso_entity_duplicates_write",
    },
    "iaso_planning_permissions": {
        "read": "iaso_planning_read",
        "write": "iaso_planning_write",
    },
    "iaso_page_permissions": {"read": "iaso_pages", "write": "iaso_page_write"},
    "iaso_user_permissions": {"geo_limited": "iaso_users_managed", "all": "iaso_users"},
}

permissions_presentation = {
    "forms": [
        "iaso_forms",
        "iaso_forms_stats",
        "iaso_update_submission",
        "iaso_submissions",
        "iaso_completeness",
        "iaso_completeness_stats",
    ],
    "org_units": [
        "iaso_org_units",
        "iaso_org_units_read",
        "iaso_org_unit_types",
        "iaso_org_unit_groups",
        "iaso_org_units_history",
    ],
    "data_validation": [
        "iaso_org_unit_change_request_review",
        "iaso_org_unit_change_request_configurations",
    ],
    "registry": [
        "iaso_registry_read",
        "iaso_registry_write",
    ],
    "entities": [
        "iaso_entities",
        "iaso_workflows",
        "iaso_entity_duplicates_write",
        "iaso_entity_duplicates_read",
        "iaso_entity_type_write",
    ],
    "payments": ["iaso_payments"],
    "dhis2_mapping": ["iaso_mappings"],
    "external_storage": ["iaso_storages"],
    "planning": ["iaso_assignments", "iaso_planning_write", "iaso_planning_read"],
    "embedded_links": ["iaso_pages", "iaso_page_write"],
    "admin": [
        "iaso_data_tasks",
        "iaso_reports",
        "iaso_projects",
        "iaso_users",
        "iaso_users_managed",
        "iaso_user_roles",
        "iaso_teams",
        "iaso_modules",
        "iaso_mobile_app_offline_setup",
        "iaso_sources",
        "iaso_sources_can_change_default_version",
        "iaso_write_sources",
        "iaso_links",
    ],
}

module_permissions = {
    "DATA_COLLECTION_FORMS": [
        "iaso_forms",
        "iaso_forms_stats",
        "iaso_update_submission",
        "iaso_submissions",
        "iaso_completeness_stats",
    ],
    "DEFAULT": [
        "iaso_org_units",
        "iaso_org_units_read",
        "iaso_org_unit_types",
        "iaso_org_unit_groups",
        "iaso_org_units_history",
        "iaso_sources",
        "iaso_sources_can_change_default_version",
        "iaso_write_sources",
        "iaso_links",
        "iaso_data_tasks",
        "iaso_reports",
        "iaso_projects",
        "iaso_users",
        "iaso_users_managed",
        "iaso_user_roles",
        "iaso_teams",
        "iaso_modules",
        "iaso_mobile_app_offline_setup",
    ],
    "DHIS2_MAPPING": ["iaso_mappings"],
    "EMBEDDED_LINKS": ["iaso_pages", "iaso_page_write"],
    "ENTITIES": [
        "iaso_entities",
        "iaso_workflows",
        "iaso_entity_duplicates_write",
        "iaso_entity_duplicates_read",
        "iaso_entity_type_write",
    ],
    "EXTERNAL_STORAGE": ["iaso_storages"],
    "PLANNING": ["iaso_assignments", "iaso_planning_write", "iaso_planning_read"],
    "REGISTRY": [
        "iaso_registry_write",
        "iaso_registry_read",
    ],
    "PAYMENTS": ["iaso_payments"],
    "COMPLETENESS_PER_PERIOD": ["iaso_completeness"],
    "DATA_VALIDATION": [
        "iaso_org_unit_change_request_review",
        "iaso_org_unit_change_request_configurations",
    ],
}


class CorePermissionSupport(models.Model):
    class Meta:
        managed = False
        default_permissions = []
        permissions = (
            (_FORMS, _("Formulaires")),
            (_FORMS_STATS, _("Statistiques pour les formulaires")),
            (_MAPPINGS, _("Correspondances avec DHIS2")),
            (_MODULES, _("modules")),
            (_COMPLETENESS, _("Complétude des données")),
            (_ORG_UNITS, _("Unités d'organisations")),
            (_ORG_UNITS_HISTORY, _("Historique des unités d'organisation")),
            (_ORG_UNITS_READ, _("Lire les unités d'organisations")),
            (_REGISTRY_WRITE, _("Editer le Registre")),
            (_REGISTRY_READ, _("Lire le Registre")),
            (_LINKS, _("Correspondances sources")),
            (_USERS_ADMIN, _("Users")),
            (_USERS_MANAGED, _("Users managed")),
            (_PAGES, _("Pages")),
            (_PROJECTS, _("Projets")),
            (_SOURCES, _("Sources")),
            (
                _SOURCES_CAN_CHANGE_DEFAULT_VERSION,
                _("Can change the default version of a data source"),
            ),
            (_DATA_TASKS, _("Tâches")),
            (_SUBMISSIONS, _("Soumissions")),
            (_SUBMISSIONS_UPDATE, _("Editer soumissions")),
            (_PLANNING_WRITE, _("Editer le planning")),
            (_PLANNING_READ, _("Lire le planning")),
            (_REPORTS, _("Reports")),
            (_TEAMS, _("Equipes")),
            (_ASSIGNMENTS, _("Attributions")),
            (_ENTITIES, _("Entities")),
            (_ENTITY_TYPE_WRITE, _("Write entity type")),
            (_STORAGE, _("Storages")),
            (_COMPLETENESS_STATS, _("Completeness stats")),
            (_WORKFLOW, _("Workflows")),
            (_ENTITIES_DUPLICATE_READ, _("Read Entity duplicates")),
            (_ENTITIES_DUPLICATE_WRITE, _("Write Entity duplicates")),
            (_USERS_ROLES, _("Manage user roles")),
            (_DATASTORE_READ, _("Read data store")),
            (_DATASTORE_WRITE, _("Write data store")),
            (_ORG_UNITS_TYPES, _("Org unit types")),
            (_ORG_UNITS_GROUPS, _("Org unit groups")),
            (_ORG_UNITS_CHANGE_REQUEST_REVIEW, _("Org unit change request review")),
            (
                _ORG_UNITS_CHANGE_REQUEST_CONFIGURATIONS,
                _("Org unit change request configurations"),
            ),
            (_SOURCE_WRITE, _("Write data source")),
            (_PAGE_WRITE, _("Write page")),
            (_PAYMENTS, _("Payments page")),
            (_MOBILE_APP_OFFLINE_SETUP, ("Mobile app offline setup")),
        )
