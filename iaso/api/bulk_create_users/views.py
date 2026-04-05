import io

import pandas as pd

from django.contrib.auth.models import User
from django.core.files.base import ContentFile
from django.db import transaction
from django.http import FileResponse
from drf_spectacular.utils import extend_schema
from rest_framework.decorators import action
from rest_framework.mixins import CreateModelMixin
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from hat.audit.models import PROFILE_API_BULK
from iaso.api.bulk_create_users.permissions import HasUserPermission
from iaso.api.bulk_create_users.serializers import BulkCreateUserSerializer
from iaso.api.profiles.audit import ProfileAuditLogger
from iaso.models import BulkCreateUserCsvFile, Profile, Team
from iaso.tasks.bulk_create_users_email import send_bulk_email_invitations


@extend_schema(tags=["Profiles", "Users"])
class BulkCreateUserFromCsvViewSet(CreateModelMixin, GenericViewSet):
    """API endpoint to bulk create users and profiles from a CSV file.

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

    Sample CSV:
        username,password,email,first_name,last_name,orgunit,orgunit__source_ref,profile_language,dhis2_id,organization,permissions,user_roles,projects,teams,phone_number,editable_org_unit_types
        john,SecurePass123!,john@example.com,John,Doe,123,,,en,,iaso_forms,manager,Project1,Team1,+1234567890,1

    Notes:
        - CSV field values take precedence over default values
        - Use org unit IDs instead of names when possible (less error-prone)
        - Users with email but no password will receive an email invitation
    """

    result_key = "file"
    remove_results_key_if_paginated = True
    permission_classes = [HasUserPermission]
    model = BulkCreateUserCsvFile
    serializer_class = BulkCreateUserSerializer

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """Create users from CSV file with optional default values.

        CSV field values take precedence. Default fields provide fallback values
        for empty fields across all users in a single atomic transaction.

        Email invitations are sent automatically to users without passwords
        (users with email but no password in CSV).

        Request body:
        {
            "file": <csv file>,
            "default_permissions": [1, 2],
            "default_projects": [1],
            "default_user_roles": [1, 2],
            "default_profile_language": "en",
            "default_organization": "WHO",
            "default_org_units": [123, 456],
            "default_teams": [1, 2]
        }
        """
        importer_user = request.user
        importer_account = importer_user.iaso_profile.account

        # Validate file and bulk configuration fields via serializer (includes CSV parsing and validation)
        serializer = self.get_serializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        # Get validated CSV data and context from serializer
        csv_data = serializer.parsed_csv_data
        csv_data_cache = serializer.csv_data_cache

        # Use serializer data and cached objects directly
        default_data = serializer.validated_data
        csv_objects_cache = serializer.csv_objects_cache

        created_users, created_profiles = self._bulk_create_users_and_profiles(
            csv_data,
            importer_user,
            importer_account,
            csv_data_cache,
            default_data,
            csv_objects_cache,
        )

        csv_file_instance = self._create_csv_file_record(
            request.FILES["file"], default_data, csv_objects_cache, importer_user, importer_account
        )

        # remove passwords from stored CSV using pandas
        csv_file_instance.file.seek(0)
        file_content = csv_file_instance.file.read().decode("utf-8")
        delimiter = ";" if ";" in file_content else ","
        csv_data = pd.read_csv(io.StringIO(file_content), delimiter=delimiter)
        csv_data["password"] = ""
        csv_content = csv_data.to_csv(path_or_buf=None, index=False, sep=delimiter)
        content_file = ContentFile(csv_content.encode("utf-8"))
        csv_file_instance.file.save(f"{csv_file_instance.id}.csv", content_file, save=False)
        csv_file_instance.save()

        audit_logger = ProfileAuditLogger()
        self._audit(created_profiles, audit_logger, importer_user)

        response = {"Accounts created": len(created_users)}
        return Response(response)

    def _create_csv_file_record(self, file, default_data, csv_objects_cache, importer_user, importer_account):
        """Create BulkCreateUserCsvFile record with M2M relationships."""
        instance = BulkCreateUserCsvFile.objects.create(
            file=file,
            account=importer_account,
            created_by=importer_user,
            default_profile_language=default_data.get("default_profile_language", ""),
            default_organization=default_data.get("default_organization", ""),
        )

        if default_data.get("default_permissions"):
            permissions = csv_objects_cache.get("permissions", [])
            if permissions:
                instance.default_permissions.set(permissions)

        if default_data.get("default_projects"):
            projects = csv_objects_cache.get("projects", [])
            if projects:
                instance.default_projects.set(projects)

        if default_data.get("default_user_roles"):
            user_roles = csv_objects_cache.get("user_roles", [])
            if user_roles:
                instance.default_user_roles.set(user_roles)

        if default_data.get("default_org_units"):
            org_units = csv_objects_cache.get("org_units", [])
            if org_units:
                instance.default_org_units.set(org_units)

        if default_data.get("default_teams"):
            teams = csv_objects_cache.get("teams", [])
            if teams:
                instance.default_teams.set(teams)

        return instance

    def _bulk_create_users_and_profiles(
        self,
        csv_data,
        importer_user,
        importer_account,
        csv_data_cache,
        default_data=None,
        csv_objects_cache=None,
    ):
        """Create users and profiles using bulk operations validation context.
        Uses default_data for fallback values and csv_objects_cache for cached objects
        """
        default_data = default_data or {}
        csv_objects_cache = csv_objects_cache or {}
        audit_logger = ProfileAuditLogger()

        # Phase 1: Prepare User objects for bulk_create
        users_to_create = []

        for data in csv_data:
            user = User(
                username=data.get("username", "").strip(),
                first_name=data.get("first_name", "").strip(),
                last_name=data.get("last_name", "").strip(),
                email=data.get("email", "").strip(),
                is_active=True,
            )

            password = data.get("password", "").strip()
            email = data.get("email", "").strip() if data.get("email") else None
            # Auto-detect email invitation: no password + has email = send invitation
            send_invitation = not password and bool(email)

            if send_invitation:
                user.set_unusable_password()
            elif password:
                user.set_password(password)

            users_to_create.append(user)

        created_users = User.objects.bulk_create(users_to_create)

        # Phase 2: Prepare Profile objects for bulk_create
        profiles_to_create = []
        invitation_users = []

        for row_index, (user, data) in enumerate(zip(created_users, csv_data)):
            language = (
                data.get("profile_language", "").strip().lower()
                or default_data.get("default_profile_language", "").lower()
                or "fr"
            )

            organization = data.get("organization", "").strip() or default_data.get("default_organization", "")

            dhis2_id = data.get("dhis2_id", "").strip()

            profile = Profile(
                user=user,
                account=importer_account,
                language=language,
                dhis2_id=dhis2_id or None,
                organization=organization,
                phone_number=csv_data_cache.get("phone_numbers_by_row", {}).get(row_index, ""),
            )
            profiles_to_create.append(profile)

            if not data.get("password", "").strip() and data.get("email", "").strip():
                invitation_users.append(user)

        created_profiles = Profile.objects.bulk_create(profiles_to_create)

        # Phase 3: Handle ManyToMany relationships with bulk operations
        self._bulk_set_many_to_many_relationships(
            created_profiles,
            csv_data,
            importer_user,
            importer_account,
            csv_data_cache,
            default_data,
            csv_objects_cache,
        )

        # Phase 4: Send email invitations
        if invitation_users:
            self._send_bulk_email_invitations(invitation_users)

        return created_users, created_profiles

    def _bulk_set_many_to_many_relationships(
        self,
        profiles,
        user_data,
        importer_user,
        importer_account,
        csv_data_cache,
        default_data=None,
        csv_objects_cache=None,
    ):
        """Set ManyToMany relationships using bulk operations and cached validated objects.

        Uses default_data for defaults and csv_objects_cache for cached objects.
        """
        default_data = default_data or {}
        csv_objects_cache = csv_objects_cache or {}

        profile_org_units_list = []
        profile_projects_list = []
        profile_user_roles_list = []
        user_groups_list = []
        user_permissions_list = []
        profile_editable_types_list = []
        team_users_list = []

        for row_index, (profile, data) in enumerate(zip(profiles, user_data)):
            org_units_to_add = csv_data_cache["org_units_by_row"].get(row_index, [])
            if not org_units_to_add:
                org_units_to_add = csv_objects_cache.get("org_units", [])

            for ou in org_units_to_add:
                profile_org_units_list.append(Profile.org_units.through(profile=profile, orgunit=ou))

            cached_projects = csv_data_cache["projects_by_row"].get(row_index, [])
            if not cached_projects:
                cached_projects = csv_objects_cache.get("projects", [])

            for project in cached_projects:
                profile_projects_list.append(Profile.projects.through(profile=profile, project=project))

            cached_teams = csv_data_cache["teams_by_row"].get(row_index, [])
            if not cached_teams:
                cached_teams = csv_objects_cache.get("teams", [])

            for team in cached_teams:
                team_users_list.append(Team.users.through(team=team, user=profile.user))

            cached_roles = csv_data_cache["user_roles_by_row"].get(row_index, [])
            if not cached_roles:
                cached_roles = csv_objects_cache.get("user_roles", [])

            for role in cached_roles:
                profile_user_roles_list.append(Profile.user_roles.through(profile=profile, userrole=role))
                user_groups_list.append(User.groups.through(user=profile.user, group=role.group))

            cached_permissions = csv_data_cache["permissions_by_row"].get(row_index, [])
            if not cached_permissions:
                cached_permissions = csv_objects_cache.get("permissions", [])

            for permission in cached_permissions:
                user_permissions_list.append(User.user_permissions.through(user=profile.user, permission=permission))

            cached_editable_types = csv_data_cache["editable_org_unit_types_by_row"].get(row_index, [])
            for org_unit_type in cached_editable_types:
                profile_editable_types_list.append(
                    Profile.editable_org_unit_types.through(profile=profile, orgunittype=org_unit_type)
                )

        # Bulk create all relationships
        if profile_org_units_list:
            Profile.org_units.through.objects.bulk_create(profile_org_units_list, ignore_conflicts=True)

        if profile_projects_list:
            Profile.projects.through.objects.bulk_create(profile_projects_list, ignore_conflicts=True)

        if profile_user_roles_list:
            Profile.user_roles.through.objects.bulk_create(profile_user_roles_list, ignore_conflicts=True)

        if user_groups_list:
            User.groups.through.objects.bulk_create(user_groups_list, ignore_conflicts=True)

        if user_permissions_list:
            User.user_permissions.through.objects.bulk_create(user_permissions_list, ignore_conflicts=True)

        if team_users_list:
            Team.users.through.objects.bulk_create(team_users_list, ignore_conflicts=True)

        if profile_editable_types_list:
            Profile.editable_org_unit_types.through.objects.bulk_create(
                profile_editable_types_list, ignore_conflicts=True
            )

    def _send_bulk_email_invitations(self, users):
        """Queue background task to send email invitations to users without passwords."""
        user_ids = [
            user.id
            for user in users
            if user.email and not user.has_usable_password()  # Only users with unusable passwords need invitations
        ]

        if not user_ids:
            return

        send_bulk_email_invitations(user_ids, self.request.is_secure(), user=self.request.user)

    def _audit(self, created_profiles, audit_logger, importer_user):
        """Log created users"""
        for profile in created_profiles:
            audit_logger.log_modification(
                instance=profile,
                old_data_dump=None,
                request_user=importer_user,
                source=f"{PROFILE_API_BULK}_create",
            )

    @extend_schema(request=None)
    @action(detail=False, methods=["get"], url_path="getsample")
    def download_sample_csv(self, request):
        return FileResponse(open("iaso/api/fixtures/sample_bulk_user_creation.csv", "rb"))
