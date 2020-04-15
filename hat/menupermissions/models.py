from django.db import models
from django.utils.translation import gettext_lazy as _

MODIFICATIONS = _("Modifications")
UPLOAD_OF_CASE_FILES = _("Upload of cases files")
UPLOAD_OF_VILLAGES = _("Upload of villages files")
MACROPLANNING = _("Macroplanning")
MICROPLANNING = _("Microplanning")
ROUTES = _("Routes")
GRAPHS = _("Graphs")
REPORTS = _("Reports")
CASES = _("Cases")
CASE_ANALYSIS = _("Cases analysis")
RECONCILIATION = _("Reconciliation")
DEVICES = _("Devices")
PLANNINGS = _("Plannings")
PLANNINGS_TEMPLATE = _("Plannings template")
COORDINATIONS = _("Coordinations")
WORKZONES = _("Work zones")
TEAMS = _("Teams")
USERS = _("Users")
VILLAGES = _("Villages")
ZONES = _("Zones")
AREAS = _("Areas")
ZONES_EDIT = _("Edit zones")
AREAS_EDIT = _("Edit areas")
ZONES_SHAPES_EDIT = _("Edit zones shapes")
AREAS_SHAPES_EDIT = _("Edit areas shapes")
LOCATOR = _("Locator")
VECTOR_CONTROL = _("Vector control")
VECTOR_CONTROL_UPLOAD = _("Vector control import Gpx")
QUALITY_CONTROL = _("Quality control")
ANONYMOUS_VIEW = "Anonymisation des patients"
EDIT_PATIENT = _("Edition d'un patient")
DOWNLOAD_DATAS = _("Téléchargement de données")
DUPLICATES = _("Doublons")

FORMS = _("Formulaires")
MAPPINGS = _("Correspondances avec DHIS2")
COMPLETENESS = _("Complétude des données")
ORG_UNITS = _("Unités d'organistations")
LINKS = _("Correspondances sources")


class CustomPermissionSupport(models.Model):
    class Meta:

        managed = False  # No database table creation or deletion operations \
        # will be performed for this model.

        permissions = (
            ('x_modifications', MODIFICATIONS),
            ("x_datasets_datauploads", UPLOAD_OF_CASE_FILES),
            ("x_datasets_villageuploads", UPLOAD_OF_VILLAGES),
            ("x_plannings_macroplanning", MACROPLANNING),
            ("x_plannings_microplanning", MICROPLANNING),
            ("x_plannings_routes", ROUTES),
            ("x_stats_graphs", GRAPHS),
            ("x_stats_reports", REPORTS),
            ("x_case_cases", CASES),
            ("x_case_analysis", CASE_ANALYSIS),
            ("x_case_reconciliation", RECONCILIATION),
            ("x_management_devices", DEVICES),
            ("x_management_plannings", PLANNINGS),
            ("x_management_plannings_template", PLANNINGS_TEMPLATE),
            ("x_management_coordinations", COORDINATIONS),
            ("x_management_workzones", WORKZONES),
            ("x_management_teams", TEAMS),
            ("x_management_users", USERS),
            ("x_management_villages", VILLAGES),
            ("x_locator", LOCATOR),
            ("x_vectorcontrol", VECTOR_CONTROL),
            ("x_vectorcontrolupload", VECTOR_CONTROL_UPLOAD),
            ("x_qualitycontrol", QUALITY_CONTROL),
            ("x_anonymous", ANONYMOUS_VIEW),
            ("x_datas_patient_edition", EDIT_PATIENT),
            ("x_datas_download", DOWNLOAD_DATAS),
            ("x_duplicates", DUPLICATES),
            ('x_management_zones', ZONES),
            ('x_management_areas', AREAS),
            ('x_management_edit_zones', ZONES_EDIT),
            ('x_management_edit_areas', AREAS_EDIT),
            ('x_management_edit_shape_zones', ZONES_SHAPES_EDIT),
            ('x_management_edit_shape_areas', AREAS_SHAPES_EDIT),
            ('iaso_forms', FORMS),
            ('iaso_mappings', MAPPINGS),
            ('iaso_completeness', COMPLETENESS),
            ('iaso_org_units', ORG_UNITS),
            ('iaso_links', LINKS),
        )
