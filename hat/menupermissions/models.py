"""Permissions list

These permissions are used and not the django built in one on each model.
They are used for API access but also to see which page a user has access
in the frontend.

To add a new permission:
1. Add a constant to hold its label
2. Add it to the CustomPermissionSupport.Meta.permissions tuple bellow
3. Generate a migration via makemigrations (and run the mirgation locally)
4. Add it in hat/assets/js/apps/Iaso/domains/users/messages.js
5. add it to en.json and fr.json

If you don't follow these steps you will break the frontend !

The frontend is getting the list of existing permission from the
`/api/permissions/` endpoint
"""


from django.db import models
from django.utils.translation import gettext_lazy as _

MODIFICATIONS = _("Modifications")

USERS = _("Users")
FORMS = _("Formulaires")
MAPPINGS = _("Correspondances avec DHIS2")
COMPLETENESS = _("Complétude des données")
ORG_UNITS = _("Unités d'organisations")
REGISTRY = _("Registre")
LINKS = _("Correspondances sources")
PAGES = _("Pages")
PROJECTS = _("Projets")
SOURCES = _("Sources")
TASKS = _("Tâches")
POLIO = _("Polio")
POLIO_CONFIG = _("Polio config")
SUBMISSIONS = _("Soumissions")
UPDATE_SUBMISSIONS = _("Editer soumissions")
DHIS2_LINK = _("Show dhis2 link")
PLANNING = _("Planning")
TEAMS = _("Equipes")
ASSIGNMENTS = _("Attributions")
POLIO_BUDGET = _("Budget Polio")
POLIO_BUDGET_ADMIN = _("Budget Polio Admin")
ENTITIES = _("Entities")
BENEFICIARIES = _("Beneficiaries")
STORAGES = _("Storages")
COMPLETENESS_STATS = _("Completeness stats")
WORKFLOWS = _("Workflows")
REPORTS = _("Reports")
ENTITY_DUPLICATES_READ = _("Read Entity duplicates")
ENTITY_DUPLICATES_WRITE = _("Write Entity duplicates")
USER_ROLES = _("Manage user roles")
DATASTORE_READ = _("Read data store")
DATASTORE_WRITE = _("Write data store")
ORG_UNIT_TYPES = _("Org unit types")
ORG_UNIT_GROUPS = _("Org unit groups")
PAGE_WRITE = _("Write page")


class CustomPermissionSupport(models.Model):
    """Model used to hold our custom permission."""

    @staticmethod
    def get_full_permission_list():
        return [couple[0] for couple in CustomPermissionSupport._meta.permissions]

    """This is not a true model that generate a table hence the managed=False"""

    class Meta:
        managed = False  # No database table creation or deletion operations \
        # will be performed for this model.

        permissions = (
            ("iaso_forms", FORMS),
            ("iaso_mappings", MAPPINGS),
            ("iaso_completeness", COMPLETENESS),
            ("iaso_org_units", ORG_UNITS),
            ("iaso_registry", REGISTRY),
            ("iaso_links", LINKS),
            ("iaso_users", USERS),
            ("iaso_pages", PAGES),
            ("iaso_projects", PROJECTS),
            ("iaso_sources", SOURCES),
            ("iaso_data_tasks", TASKS),
            ("iaso_polio", POLIO),
            ("iaso_polio_config", POLIO_CONFIG),
            ("iaso_submissions", SUBMISSIONS),
            ("iaso_update_submission", UPDATE_SUBMISSIONS),
            ("iaso_planning", PLANNING),
            ("iaso_reports", REPORTS),
            ("iaso_teams", TEAMS),
            ("iaso_assignments", ASSIGNMENTS),
            ("iaso_polio_budget", POLIO_BUDGET),
            ("iaso_entities", ENTITIES),
            ("iaso_storages", STORAGES),
            ("iaso_completeness_stats", COMPLETENESS_STATS),
            ("iaso_workflows", WORKFLOWS),
            ("iaso_polio_budget_admin", POLIO_BUDGET_ADMIN),
            ("iaso_entity_duplicates_read", ENTITY_DUPLICATES_READ),
            ("iaso_entity_duplicates_write", ENTITY_DUPLICATES_WRITE),
            ("iaso_user_roles", USER_ROLES),
            ("iaso_datastore_read", DATASTORE_READ),
            ("iaso_datastore_write", DATASTORE_WRITE),
            ("iaso_org_unit_types", ORG_UNIT_TYPES),
            ("iaso_org_unit_groups", ORG_UNIT_GROUPS),
            ("iaso_page_write", PAGE_WRITE),
        )
