"""Permissions list

These permissions are used and not the django built in one on each model.
They are used for API access but also to see which page a user has access
in the frontend.

To add a new permission:
1. Add a constant to hold its label
2. Add it to the CustomPermissionSupport.Meta.permissions tuple bellow
3. Generate a migration via makemigrations (and run the migration locally)
4. Add it in hat/assets/js/apps/Iaso/domains/users/permissionsMessages.ts
5. Add it to en.json and fr.json

If you don't follow these steps you will break the frontend!

The frontend is getting the list of existing permission from the
`/api/permissions/` endpoint
"""

from importlib import import_module

from django.conf import LazySettings
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.utils.translation import gettext_lazy as _
from rest_framework.exceptions import PermissionDenied

import iaso.permissions as core_permissions


# Trypelim
_ANONYMOUS_VIEW = "iaso_trypelim_anonymous"
_AREAS = "iaso_trypelim_management_areas"
_AREAS_EDIT = "iaso_trypelim_management_edit_areas"
_AREAS_SHAPES_EDIT = "iaso_trypelim_management_edit_shape_areas"
_CASES = "iaso_trypelim_case_cases"
_CASE_ANALYSIS = "iaso_trypelim_case_analysis"
_COORDINATIONS = "iaso_trypelim_management_coordinations"
_DEVICES = "iaso_trypelim_management_devices"
_DOWNLOAD_DATAS = "iaso_trypelim_datas_download"
_DUPLICATES = "iaso_trypelim_duplicates"
_EDIT_PATIENT = "iaso_trypelim_datas_patient_edition"
_STATS_GRAPHS = "iaso_trypelim_stats_graphs"
_STATS_REPORTS = "iaso_trypelim_stats_reports"
_HEALTH_STRUCTURES = "iaso_trypelim_management_health_structures"
_LAB = "iaso_trypelim_lab"
_LAB_UPLOAD = "iaso_trypelim_labupload"
_LOCATOR = "iaso_trypelim_locator"
_MACROPLANNING = "iaso_trypelim_plannings_macroplanning"
_MICROPLANNING = "iaso_trypelim_plannings_microplanning"
_MODIFICATIONS = "iaso_trypelim_modifications"
_PLANNINGS = "iaso_trypelim_management_plannings"
_PLANNINGS_TEMPLATE = "iaso_trypelim_management_plannings_template"
_QUALITY_CONTROL = "iaso_trypelim_qualitycontrol"
_RECONCILIATION = "iaso_trypelim_case_reconciliation"
_ROUTES = "iaso_trypelim_plannings_routes"
_UPLOAD_OF_CASE_FILES = "iaso_trypelim_datasets_datauploads"
_UPLOAD_OF_VILLAGES = "iaso_trypelim_datasets_villageuploads"
_TRYPELIM_TEAMS = "iaso_trypelim_management_teams"
_USERS = "iaso_trypelim_management_users"
_VECTOR_CONTROL = "iaso_trypelim_vectorcontrol"
_VECTOR_CONTROL_UPLOAD = "iaso_trypelim_vectorcontrolupload"
_VILLAGES = "iaso_trypelim_management_villages"
_WORKZONES = "iaso_trypelim_management_workzones"
_ZONES = "iaso_trypelim_management_zones"
_ZONES_EDIT = "iaso_trypelim_management_edit_zones"
_ZONES_SHAPES_EDIT = "iaso_trypelim_management_edit_shape_zones"

_PREFIX = "menupermissions."

# Trypelim
ANONYMOUS_VIEW = _PREFIX + _ANONYMOUS_VIEW
AREAS = _PREFIX + _AREAS
AREAS_EDIT = _PREFIX + _AREAS_EDIT
AREAS_SHAPES_EDIT = _PREFIX + _AREAS_SHAPES_EDIT
CASES = _PREFIX + _CASES
CASE_ANALYSIS = _PREFIX + _CASE_ANALYSIS
COORDINATIONS = _PREFIX + _COORDINATIONS
DEVICES = _PREFIX + _DEVICES
DOWNLOAD_DATAS = _PREFIX + _DOWNLOAD_DATAS
DUPLICATES = _PREFIX + _DUPLICATES
EDIT_PATIENT = _PREFIX + _EDIT_PATIENT
HEALTH_STRUCTURES = _PREFIX + _HEALTH_STRUCTURES
LAB = _PREFIX + _LAB
LAB_UPLOAD = _PREFIX + _LAB_UPLOAD
LOCATOR = _PREFIX + _LOCATOR
MACROPLANNING = _PREFIX + _MACROPLANNING
MICROPLANNING = _PREFIX + _MICROPLANNING
MODIFICATIONS = _PREFIX + _MODIFICATIONS
PLANNINGS = _PREFIX + _PLANNINGS
PLANNINGS_TEMPLATE = _PREFIX + _PLANNINGS_TEMPLATE
QUALITY_CONTROL = _PREFIX + _QUALITY_CONTROL
RECONCILIATION = _PREFIX + _RECONCILIATION
ROUTES = _PREFIX + _ROUTES
STATS_GRAPHS = _PREFIX + _STATS_GRAPHS
STATS_REPORTS = _PREFIX + _STATS_REPORTS
UPLOAD_OF_CASE_FILES = _PREFIX + _UPLOAD_OF_CASE_FILES
UPLOAD_OF_VILLAGES = _PREFIX + _UPLOAD_OF_VILLAGES
TRYPELIM_TEAMS = _PREFIX + _TRYPELIM_TEAMS
USERS = _PREFIX + _USERS
VECTOR_CONTROL = _PREFIX + _VECTOR_CONTROL
VECTOR_CONTROL_UPLOAD = _PREFIX + _VECTOR_CONTROL_UPLOAD
VILLAGES = _PREFIX + _VILLAGES
WORKZONES = _PREFIX + _WORKZONES
ZONES = _PREFIX + _ZONES
ZONES_EDIT = _PREFIX + _ZONES_EDIT
ZONES_SHAPES_EDIT = _PREFIX + _ZONES_SHAPES_EDIT


class CustomPermissionSupport(models.Model):
    """
    Model used to hold our custom permission.

    The standard way to create custom permissions in Django is to use
    the `Meta.permissions` attribute for a given model.
    https://docs.djangoproject.com/en/4.2/topics/auth/customizing/#custom-permissions

    Instead of adding permissions to each and every model, we use this single
    model with `managed = False` to regroup all permissions.
    https://docs.djangoproject.com/en/4.2/ref/models/options/#managed

    After adding a permission here, you need to generate a migration (`makemigrations`)
    and run it (`migrate`). Django will then detect the change in `Meta.permissions`
    and insert the new permission in the `auth_permission` model.

    You'll then be able to use the permission as any other Django permission.
    https://docs.djangoproject.com/en/4.2/topics/auth/default/#topic-authorization
    """

    @staticmethod
    def get_full_permission_list():
        return [couple[0] for couple in CustomPermissionSupport._meta.permissions]

    # Used in setup_account api
    DEFAULT_PERMISSIONS_FOR_NEW_ACCOUNT_USER = [
        core_permissions._FORMS,
        core_permissions._SUBMISSIONS,
        core_permissions._MAPPINGS,
        core_permissions._COMPLETENESS,
        core_permissions._ORG_UNITS,
        core_permissions._LINKS,
        core_permissions._USERS_ADMIN,
        core_permissions._PROJECTS,
        core_permissions._SOURCES,
        core_permissions._DATA_TASKS,
        core_permissions._REPORTS,
    ]

    class Meta:
        managed = False  # No database table creation or deletion operations \
        # will be performed for this model.

        permissions = (
            # Trypelim
            (_ANONYMOUS_VIEW, "Anonymisation des patients"),
            (_AREAS, _("Areas")),
            (_AREAS_EDIT, _("Edit areas")),
            (_AREAS_SHAPES_EDIT, _("Edit areas shapes")),
            (_CASES, _("Cases")),
            (_CASE_ANALYSIS, _("Cases analysis")),
            (_COORDINATIONS, _("Coordinations")),
            (_DEVICES, _("Devices")),
            (_DOWNLOAD_DATAS, _("Téléchargement de données")),
            (_DUPLICATES, _("Doublons")),
            (_EDIT_PATIENT, _("Edition d'un patient")),
            (_HEALTH_STRUCTURES, _("Health facilities")),
            (_LAB, _("Labo")),
            (_LAB_UPLOAD, _("Labo import")),
            (_LOCATOR, _("Locator")),
            (_MACROPLANNING, _("Macroplanning")),
            (_MICROPLANNING, _("Microplanning")),
            (_MODIFICATIONS, _("Modifications")),
            (_PLANNINGS, _("Plannings")),
            (_PLANNINGS_TEMPLATE, _("Plannings template")),
            (_QUALITY_CONTROL, _("Quality control")),
            (_RECONCILIATION, _("Reconciliation")),
            (_ROUTES, _("Routes")),
            (_STATS_GRAPHS, _("Graphs")),
            (_STATS_REPORTS, _("Reports")),
            (_UPLOAD_OF_CASE_FILES, _("Upload of cases files")),
            (_UPLOAD_OF_VILLAGES, _("Upload of villages files")),
            (_TRYPELIM_TEAMS, _("Teams")),
            (_USERS, _("Users")),
            (_VECTOR_CONTROL, _("Vector control")),
            (_VECTOR_CONTROL_UPLOAD, _("Vector control import Gpx")),
            (_VILLAGES, _("Villages")),
            (_WORKZONES, _("Work zones")),
            (_ZONES, _("Zones")),
            (_ZONES_EDIT, _("Edit zones")),
            (_ZONES_SHAPES_EDIT, _("Edit zones shapes")),
        )

    @staticmethod
    def filter_permissions(permissions, modules_permissions, settings: LazySettings):
        content_types = [ContentType.objects.get_for_model(CustomPermissionSupport)]
        content_types.append(ContentType.objects.get_for_model(core_permissions.CorePermissionSupport))

        for plugin in settings.PLUGINS:
            try:
                permission_model = import_module(f"plugins.{plugin}.permissions").permission_model
                content_types.append(ContentType.objects.get_for_model(permission_model))
            except ImportError:
                print(f"{plugin} plugin has no permission support")

        permissions = (
            permissions.filter(content_type__in=content_types)
            .filter(codename__startswith="iaso_")
            .filter(codename__in=modules_permissions)
            .exclude(codename__contains="datastore")
            .exclude(codename__contains="iaso_beneficiaries")
            .order_by("id")
        )

        return permissions

    @staticmethod
    def assert_right_to_assign(user, permission_codename: str):
        if not user.has_perm(core_permissions.USERS_ADMIN) and permission_codename == core_permissions._USERS_ADMIN:
            raise PermissionDenied(
                f"Only users with {core_permissions.USERS_ADMIN} permission can grant {core_permissions.USERS_ADMIN} permission"
            )
