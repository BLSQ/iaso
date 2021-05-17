from django.db import models
from django.utils.translation import gettext_lazy as _

MODIFICATIONS = _("Modifications")

TEAMS = _("Teams")
USERS = _("Users")
FORMS = _("Formulaires")
MAPPINGS = _("Correspondances avec DHIS2")
COMPLETENESS = _("Complétude des données")
ORG_UNITS = _("Unités d'organisations")
LINKS = _("Correspondances sources")
USERS = _("Utilisateurs")
PROJECTS = _("Projets")
SOURCES = _("Sources")


class CustomPermissionSupport(models.Model):
    # Used in setup_account api
    DEFAULT_PERMISSIONS_FOR_NEW_ACCOUNT_USER = [
        "iaso_forms",
        "iaso_mappings",
        "iaso_completeness",
        "iaso_org_units",
        "iaso_links",
        "iaso_users",
        "iaso_projects",
        "iaso_sources",
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
            ("iaso_projects", PROJECTS),
            ("iaso_sources", SOURCES),
        )
