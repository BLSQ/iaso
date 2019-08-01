from django.db import models
from django.utils.translation import gettext_lazy as _

UPLOAD_OF_CASE_FILES = _("Upload of cases files")
UPLOAD_OF_VILLAGES = _("Upload of villages files")
MACROPLANNING = _("Macroplanning")
MICROPLANNING = _("Microplanning")
ROUTES = _("Routes")
GRAPHS = _("Graphs")
REPORTS = _("Reports")
CASES = _("Cases")
CASE_ANALYSIS  = _("Cases analysis")
RECONCILIATION = _("Reconciliation")
DEVICES = _("Devices")
PLANNINGS = _("Plannings")
PLANNINGS_TEMPLATE = _("Plannings template")
COORDINATIONS = _("Coordinations")
WORKZONES = _("Work zones")
TEAMS = _("Teams")
USERS = _("Users")
VILLAGES = _("Villages")
LOCATOR = _("Locator")
VECTOR_CONTROL = _("Vector control")
VECTOR_CONTROL_UPLOAD = _("Vector control import Gpx")
QUALITY_CONTROL = _("Quality control")
ANONYMOUS_VIEW = _("Anonymous view")
EDIT_PATIENT = _("Edition d'un patient")
DOWNLOAD_DATAS = _("Téléchargement de données")
DUPLICATES = _("Doublons")


class CustomPermissionSupport(models.Model):
    class Meta:

        managed = False  # No database table creation or deletion operations \
                         # will be performed for this model.

        permissions = (
            ('x_datasets_datauploads', UPLOAD_OF_CASE_FILES),
            ('x_datasets_villageuploads', UPLOAD_OF_VILLAGES),
            ('x_plannings_macroplanning', MACROPLANNING),
            ('x_plannings_microplanning', MICROPLANNING),
            ('x_plannings_routes', ROUTES),
            ('x_stats_graphs', GRAPHS),
            ('x_stats_reports', REPORTS),
            ('x_case_cases', CASES),
            ('x_case_analysis', CASE_ANALYSIS),
            ('x_case_reconciliation', RECONCILIATION),
            ('x_management_devices', DEVICES),
            ('x_management_plannings', PLANNINGS),
            ('x_management_plannings_template', PLANNINGS_TEMPLATE),
            ('x_management_coordinations', COORDINATIONS),
            ('x_management_workzones', WORKZONES),
            ('x_management_teams', TEAMS),
            ('x_management_users', USERS),
            ('x_management_villages', VILLAGES),
            ('x_locator', LOCATOR),
            ('x_vectorcontrol', VECTOR_CONTROL),
            ('x_vectorcontrolupload', VECTOR_CONTROL_UPLOAD),
            ('x_qualitycontrol', QUALITY_CONTROL),
            ('x_anonymous', ANONYMOUS_VIEW),
            ('x_datas_patient_edition', EDIT_PATIENT),
            ('x_datas_download', DOWNLOAD_DATAS),
            ('x_duplicates', DUPLICATES),
        )