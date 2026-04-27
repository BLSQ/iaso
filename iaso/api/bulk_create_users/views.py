from django.http import FileResponse
from drf_excel.renderers import XLSXRenderer
from drf_spectacular.utils import extend_schema
from rest_framework.decorators import action
from rest_framework.mixins import CreateModelMixin
from rest_framework.parsers import MultiPartParser
from rest_framework.viewsets import GenericViewSet
from rest_framework_csv.renderers import CSVRenderer

from hat.audit.models import PROFILE_API_BULK
from iaso.api.bulk_create_users.permissions import HasUserPermission
from iaso.api.bulk_create_users.serializers import BulkCreateUserSerializer
from iaso.api.profiles.audit import ProfileAuditLogger
from iaso.models import BulkCreateUserCsvFile


@extend_schema(tags=["Profiles", "Users"])
class BulkCreateUserFromCsvViewSet(CreateModelMixin, GenericViewSet):
    """API endpoint to bulk create users and profiles from a CSV or XLSX file.

    CSV Columns (all columns must be present, but values can be empty):
        - username (required)
        - password (required if no email, otherwise optional for email invitation)
        - email (optional, triggers email invitation if no password)
        - first_name (optional)
        - last_name (optional)
        - orgunit (optional, comma-separated IDs or names)
        - orgunit__source_ref (optional, comma-separated source refs)
        - profile_language (optional)
        - dhis2_id (optional)
        - organization (optional)
        - permissions (optional, comma-separated permission codenames)
        - user_roles (optional, comma-separated role names)
        - projects (optional, comma-separated project names)
        - teams (optional, comma-separated team names)
        - phone_number (optional, E.164 format)
        - editable_org_unit_types (optional, comma-separated type IDs)

    Default Values (applied to all users when CSV field is empty):
        All default fields use IDs (integers), not names:
        - default_permissions: list of permission IDs, e.g. [1, 2, 3]
        - default_projects: list of project IDs, e.g. [1]
        - default_user_roles: list of user role IDs, e.g. [1, 2]
        - default_org_units: list of org unit IDs, e.g. [123, 456]
        - default_teams: list of team IDs, e.g. [1, 2]
        - default_profile_language: language code, e.g. "en" or "fr"
        - default_organization: organization name, e.g. "WHO"

    Notes:
        - CSV field values take precedence over default values
        - Use org unit IDs instead of names when possible (less error-prone)
        - Users with email but no password will receive an email invitation
    """

    permission_classes = [HasUserPermission]
    model = BulkCreateUserCsvFile
    serializer_class = BulkCreateUserSerializer
    parser_classes = [MultiPartParser]

    def perform_create(self, serializer):
        instance, created_users, created_profiles = serializer.save()
        audit_logger = ProfileAuditLogger()
        self._audit(created_profiles, audit_logger, self.request.user)

    def _audit(self, created_profiles, audit_logger, importer_user):
        """Log created users"""
        audit_logger.bulk_log_modifications(
            items=[
                {
                    "instance": profile,
                    "old_data_dump": None,
                    "source": f"{PROFILE_API_BULK}_create",
                }
                for profile in created_profiles
            ],
            request_user=importer_user,
        )

    @extend_schema(
        request=None,
        responses={(200, CSVRenderer.media_type): bytes},
        description=(
            "Returns a sample CSV file with content:\n"
            "username,password,email,first_name,last_name,orgunit,orgunit__source_ref,profile_language,dhis2_id,organization,permissions,user_roles,projects,teams,phone_number,editable_org_unit_types\n"
            'user name should not contain whitespaces,"Min. 8 characters, should include 1 letter and 1 number",,,,Use Org Unit ID to avoid errors,Org Unit external ID,"Possible values: iaso_forms,iaso_mappings, etc.","Possible values: EN, FR",Optional,Optional,projects,user roles,"Use Team names. Use comma separated values for multiple teams: Team A,Team B",The phone number as a string (e.g. +32...),"Use comma separated Org Unit Type IDs: 1, 2"'
        ),
    )
    @action(detail=False, methods=["get"], url_path="get-sample-csv", renderer_classes=[CSVRenderer])
    def download_sample_csv(self, request):
        return FileResponse(
            open("iaso/api/fixtures/sample_bulk_user_creation.csv", "rb"),
            content_type=CSVRenderer.media_type,
            as_attachment=True,
        )

    @extend_schema(
        request=None,
        responses={(200, XLSXRenderer.media_type): bytes},
        description=(
            "Returns a sample XLSX file with content:\n"
            "username,password,email,first_name,last_name,orgunit,orgunit__source_ref,profile_language,dhis2_id,organization,permissions,user_roles,projects,teams,phone_number,editable_org_unit_types\n"
            'user name should not contain whitespaces,"Min. 8 characters, should include 1 letter and 1 number",,,,Use Org Unit ID to avoid errors,Org Unit external ID,"Possible values: iaso_forms,iaso_mappings, etc.","Possible values: EN, FR",Optional,Optional,projects,user roles,"Use Team names. Use comma separated values for multiple teams: Team A,Team B",The phone number as a string (e.g. +32...),"Use comma separated Org Unit Type IDs: 1, 2"'
        ),
    )
    @action(detail=False, methods=["get"], url_path="get-sample-xlsx", renderer_classes=[XLSXRenderer])
    def download_sample_xlsx(self, request):
        return FileResponse(
            open("iaso/api/fixtures/sample_bulk_user_creation.xlsx", "rb"),
            content_type=XLSXRenderer.media_type,
            as_attachment=True,
        )
