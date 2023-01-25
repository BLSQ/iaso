from django.db import models
from django.utils.translation import gettext_lazy as _

MODIFICATIONS = _("Modifications")

USERS = _("Users")
FORMS = _("Formulaires")
MAPPINGS = _("Correspondances avec DHIS2")
COMPLETENESS = _("Complétude des données")
ORG_UNITS = _("Unités d'organisations")
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


# When adding a new permission, it also needs to be added in
# hat/assets/js/apps/Iaso/domains/users/messages.js
# so that it display properly in both lang
#
# Also, don't forget to generate a migration


class CustomPermissionSupport(models.Model):
    # Used in setup_account api
    DEFAULT_PERMISSIONS_FOR_NEW_ACCOUNT_USER = [
        "iaso_forms",
        "iaso_submissions",
        "iaso_mappings",
        "iaso_completeness",
        "iaso_org_units",
        "iaso_links",
        "iaso_users",
        "iaso_projects",
        "iaso_sources",
        "iaso_data_tasks",
        "iaso_reports",
    ]

    class Meta:
        managed = False  # No database table creation or deletion operations \
        # will be performed for this model.

        permissions = (
            ("x_modifications", MODIFICATIONS),
            ("x_management_teams", TEAMS),
            ("x_management_users", USERS),
            ("iaso_forms", FORMS),
            ("iaso_mappings", MAPPINGS),
            ("iaso_completeness", COMPLETENESS),
            ("iaso_org_units", ORG_UNITS),
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
        )
