from typing import Any, List, Optional, Union

from django.conf import settings
from django.contrib.auth import models, update_session_auth_hash
from django.contrib.auth.models import Permission, User
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core.mail import send_mail
from django.core.paginator import Paginator
from django.db.models import Min, Q, QuerySet
from django.db.transaction import atomic
from django.http import HttpRequest, HttpResponse, JsonResponse, StreamingHttpResponse
from django.shortcuts import get_object_or_404
from django.template import Context, Template
from django.urls import reverse
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from django.utils.translation import gettext as _
from phonenumber_field.phonenumber import PhoneNumber
from phonenumbers import NumberParseException
from rest_framework import permissions, status, viewsets
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response

from hat.api.export_utils import Echo, generate_xlsx, iter_items
from hat.audit.models import PROFILE_API
from iaso.api.common import CONTENT_TYPE_CSV, CONTENT_TYPE_XLSX, FileFormatEnum
from iaso.api.profiles.audit import ProfileAuditLogger
from iaso.api.profiles.bulk_create_users import BULK_CREATE_USER_COLUMNS_LIST
from iaso.models import OrgUnit, OrgUnitType, Profile, Project, TenantUser, UserRole
from iaso.models.tenant_users import UserCreationData, UsernameAlreadyExistsError
from iaso.permissions.core_permissions import CORE_USERS_ADMIN_PERMISSION, CORE_USERS_MANAGED_PERMISSION
from iaso.permissions.utils import raise_error_if_user_lacks_admin_permission
from iaso.utils import is_mobile_request, search_by_ids_refs


PK_ME = "me"


class HasProfilePermission(permissions.BasePermission):
    def has_permission(self, request, view):
        pk = view.kwargs.get("pk")
        if view.action in ("retrieve", "partial_update") and pk == PK_ME:
            return True
        if request.user.has_perm(CORE_USERS_ADMIN_PERMISSION.full_name()):
            return True
        if request.user.has_perm(CORE_USERS_MANAGED_PERMISSION.full_name()):
            return self.has_permission_over_user(request, pk)

        return request.method == "GET"

    # We could `return False` instead of raising exceptions,
    # but it's better to be explicit about why the permission was denied.
    @staticmethod
    def has_permission_over_user(request, pk):
        if request.method == "GET":
            return True

        if not pk:
            new_user_org_units = request.data.get("org_units", [])
            if len(new_user_org_units) == 0:
                raise PermissionDenied(
                    f"User with '{CORE_USERS_MANAGED_PERMISSION}' can not create a new user without a location."
                )

        if pk == request.user.id:
            raise PermissionDenied(f"User with '{CORE_USERS_MANAGED_PERMISSION}' cannot edit their own permissions.")

        org_units = OrgUnit.objects.hierarchy(request.user.iaso_profile.org_units.all()).values_list("id", flat=True)

        if org_units and pk and len(org_units) > 0:
            profile = get_object_or_404(Profile.objects.filter(account=request.user.iaso_profile.account), pk=pk)
            user_managed_org_units = profile.org_units.filter(id__in=org_units).all()
            if not user_managed_org_units or len(user_managed_org_units) == 0:
                raise PermissionDenied(
                    "The user we are trying to modify is not part of any OrgUnit managed by the current user"
                )
        return True


def get_filtered_profiles(
    queryset: QuerySet[Profile],
    user: Optional[User],
    search: Optional[str] = None,
    perms: Optional[List[str]] = None,
    location: Optional[str] = None,
    org_unit_type: Optional[str] = None,
    parent_ou: Optional[bool] = False,
    children_ou: Optional[bool] = False,
    projects: Optional[List[int]] = None,
    user_roles: Optional[List[int]] = None,
    teams: Optional[List[int]] = None,
    managed_users_only: Optional[bool] = False,
    ids: Optional[str] = None,
) -> QuerySet[Profile]:
    if search:
        if search.startswith("ids:"):
            queryset = queryset.filter(id__in=search_by_ids_refs.parse_ids("ids:", search))
        elif search.startswith("refs:"):
            queryset = queryset.filter(dhis2_id__in=search_by_ids_refs.parse_ids("refs:", search))
        else:
            queryset = queryset.filter(
                Q(user__username__icontains=search)
                | Q(user__tenant_user__main_user__username__icontains=search)
                | Q(user__first_name__icontains=search)
                | Q(user__last_name__icontains=search)
            ).distinct()

    if perms:
        queryset = queryset.filter(user__user_permissions__codename__in=perms).distinct()

    if location and not (parent_ou or children_ou):
        queryset = queryset.filter(
            user__iaso_profile__org_units__pk=location,
        ).distinct()

    parent: Optional[OrgUnit] = None
    if (parent_ou and location) or (children_ou and location):
        ou = get_object_or_404(OrgUnit, pk=location)
        if parent_ou and ou.parent is not None:
            parent = ou.parent

        org_unit_filter = Q(user__iaso_profile__org_units__pk=location)

        if parent_ou and not children_ou:
            if parent:
                org_unit_filter |= Q(user__iaso_profile__org_units__pk=parent.pk)
            queryset = queryset.filter(org_unit_filter).distinct()

        elif children_ou and not parent_ou:
            descendant_ous = OrgUnit.objects.hierarchy(ou)
            org_unit_filter |= Q(user__iaso_profile__org_units__in=descendant_ous)
            queryset = queryset.filter(org_unit_filter).distinct()

        elif parent_ou and children_ou:
            descendant_ous = OrgUnit.objects.hierarchy(ou)
            org_unit_filter |= Q(user__iaso_profile__org_units__in=descendant_ous)
            if parent:
                org_unit_filter |= Q(user__iaso_profile__org_units__pk=parent.pk)
            queryset = queryset.filter(org_unit_filter).distinct()

    if org_unit_type:
        if org_unit_type == "unassigned":
            queryset = queryset.filter(user__iaso_profile__org_units__org_unit_type__pk=None).distinct()
        else:
            queryset = queryset.filter(user__iaso_profile__org_units__org_unit_type__pk=org_unit_type).distinct()

    if projects:
        queryset = queryset.filter(user__iaso_profile__projects__pk__in=projects).distinct()

    if user_roles:
        queryset = queryset.filter(user__iaso_profile__user_roles__pk__in=user_roles).distinct()

    if teams:
        queryset = queryset.filter(user__teams__id__in=teams).distinct()

    if ids:
        queryset = queryset.filter(user__id__in=ids.split(","))
    if managed_users_only:
        if not user:
            raise Exception("User cannot be 'None' when filtering on managed users only")
        if user.has_perm(CORE_USERS_ADMIN_PERMISSION.full_name()):
            queryset = queryset  # no filter needed
        elif user.has_perm(CORE_USERS_MANAGED_PERMISSION.full_name()):
            managed_org_units = OrgUnit.objects.hierarchy(user.iaso_profile.org_units.all()).values_list(
                "id", flat=True
            )
            if managed_org_units and len(managed_org_units) > 0:
                queryset = queryset.filter(user__iaso_profile__org_units__id__in=managed_org_units)
            queryset = queryset.exclude(user=user)
        else:
            queryset = Profile.objects.none()
    return queryset


class ProfileError(ValidationError):
    field = None

    def __init__(self, field=None, detail=None, code=None):
        super().__init__(detail, code)
        self.field = field


class ProfilesViewSet(viewsets.ViewSet):
    f"""Profiles API

    This API is restricted to authenticated users having the "{CORE_USERS_ADMIN_PERMISSION}" or "{CORE_USERS_MANAGED_PERMISSION}"
    permission for write core_permissions.
    Read access is accessible to any authenticated users as it necessary to list profile or display a particular one in
    the interface.

    Any logged user can also edit his profile to set his language.


    GET /api/profiles/
    GET /api/profiles/me => current user
    GET /api/profiles/<id>
    POST /api/profiles/
    PATCH /api/profiles/me => current user, can only set language field
    PATCH /api/profiles/<id>
    DELETE /api/profiles/<id>
    """

    # FIXME : replace by a model viewset

    permission_classes = [permissions.IsAuthenticated, HasProfilePermission]

    def get_queryset(self):
        account = self.request.user.iaso_profile.account
        return Profile.objects.filter(account=account).with_editable_org_unit_types()

    def retrieve(self, request, *args, **kwargs):
        pk = kwargs.get("pk")
        if pk == PK_ME:
            try:
                queryset = self.get_queryset()
                profile = queryset.get(user=request.user)
                profile_dict = profile.as_dict()
                return Response(profile_dict)
            except Profile.DoesNotExist:
                return Response(
                    {
                        "first_name": request.user.first_name,
                        "user_name": request.user.username,
                        "last_name": request.user.last_name,
                        "email": request.user.email,
                        "user_id": request.user.id,
                        "projects": [],
                        "is_staff": request.user.is_staff,
                        "is_superuser": request.user.is_superuser,
                        "account": None,
                    }
                )
        else:
            profile = get_object_or_404(self.get_queryset(), pk=pk)
            return Response(profile.as_dict())

    def list(self, request):
        limit = request.GET.get("limit", None)
        page_offset = request.GET.get("page", 1)
        orders = request.GET.get("order", "user__username").split(",")
        ids = request.GET.get("ids", None)
        search = request.GET.get("search", None)
        perms = request.GET.get("permissions", None)
        if perms:
            perms = perms.split(",")
        location = request.GET.get("location", None)
        org_unit_type = request.GET.get("orgUnitTypes", None)
        parent_ou = request.GET.get("ouParent", None) == "true"
        children_ou = request.GET.get("ouChildren", None) == "true"
        projects = request.GET.get("projects", None)
        if projects:
            projects = projects.split(",")
        user_roles = request.GET.get("userRoles", None)
        if user_roles:
            user_roles = user_roles.split(",")
        teams = request.GET.get("teams", None)
        if teams:
            teams = teams.split(",")
        managed_users_only = request.GET.get("managedUsersOnly", None) == "true"
        queryset = (
            get_filtered_profiles(
                queryset=self.get_queryset(),
                user=request.user,
                search=search,
                perms=perms,
                location=location,
                org_unit_type=org_unit_type,
                parent_ou=parent_ou,
                children_ou=children_ou,
                projects=projects,
                user_roles=user_roles,
                teams=teams,
                managed_users_only=managed_users_only,
                ids=ids,
            )
            .annotate(
                # Adds a sortable field containing each user's alphabetically first role name,
                # enabling consistent frontend sorting of users with multiple roles.
                annotated_first_user_role=Min("user_roles__group__name")
            )
            .order_by("id")
        )

        queryset = queryset.prefetch_related(
            "user",
            "user_roles",
            "user__tenant_user",
            "org_units",
            "org_units__version",
            "org_units__version__data_source",
            "org_units__parent",
            "org_units__parent__parent",
            "org_units__parent__parent__parent",
            "org_units__org_unit_type",
            "org_units__parent__org_unit_type",
            "org_units__parent__parent__org_unit_type",
            "projects",
            "editable_org_unit_types",
        )
        if request.GET.get("csv"):
            return self.list_export(queryset=queryset, file_format=FileFormatEnum.CSV)
        if request.GET.get("xlsx"):
            return self.list_export(queryset=queryset, file_format=FileFormatEnum.XLSX)

        if limit:
            queryset = queryset.order_by(*orders)
            limit = int(limit)
            page_offset = int(page_offset)
            paginator = Paginator(queryset, limit)
            res = {"count": paginator.count}
            if page_offset > paginator.num_pages:
                page_offset = paginator.num_pages
            page = paginator.page(page_offset)

            res["profiles"] = map(lambda x: x.as_dict(small=True), page.object_list)
            res["has_next"] = page.has_next()
            res["has_previous"] = page.has_previous()
            res["page"] = page_offset
            res["pages"] = paginator.num_pages
            res["limit"] = limit
            return Response(res)
        return Response({"profiles": [profile.as_short_dict() for profile in queryset]})

    @atomic
    def create(self, request):
        current_profile = request.user.iaso_profile
        current_account = current_profile.account

        email = request.data.get("email", "")
        first_name = request.data.get("first_name", "")
        last_name = request.data.get("last_name", "")
        password = request.data.get("password", "")
        send_email_invitation = request.data.get("send_email_invitation")
        username = request.data.get("user_name")

        if not username:
            return JsonResponse({"errorKey": "user_name", "errorMessage": _("Nom d'utilisateur requis")}, status=400)

        if not password and not send_email_invitation:
            return JsonResponse({"errorKey": "password", "errorMessage": _("Mot de passe requis")}, status=400)

        try:
            # Currently, the `account` is always the same in the UI.
            # This means that we'll never get back a `tenant_main_user` here - at least for the moment.
            # Yet we keep `create_user_or_tenant_user()` here to avoid repeating part of its logic.
            new_user, tenant_main_user, tenant_account_user = TenantUser.objects.create_user_or_tenant_user(
                data=UserCreationData(
                    username=username,
                    email=email,
                    first_name=first_name,
                    last_name=last_name,
                    account=current_account,
                )
            )
        except UsernameAlreadyExistsError as e:
            return JsonResponse({"errorKey": "user_name", "errorMessage": e.message}, status=400)

        user_who_logs_in = new_user or tenant_main_user
        if password != "":
            user_who_logs_in.set_password(password)
            user_who_logs_in.save()

        user = new_user or tenant_account_user

        user.profile = Profile.objects.create(
            user=user,
            account=current_account,
            language=request.data.get("language", ""),
            home_page=request.data.get("home_page", ""),
            organization=request.data.get("organization", None),
        )

        try:
            user_permissions = self.validate_user_permissions(request, current_account)
            org_units = self.validate_org_units(request, user.profile)
            user_roles_data = self.validate_user_roles(request)
            projects = self.validate_projects(request, user.profile)
            editable_org_unit_types = self.validate_editable_org_unit_types(request, user.profile)
        except ProfileError as error:
            # Delete profile if error since we're creating a new user
            user.profile.delete()
            return JsonResponse(
                {"errorKey": error.field, "errorMessage": error.detail},
                status=status.HTTP_400_BAD_REQUEST,
            )

        profile = self.update_user_profile(
            request=request,
            profile=user.profile,
            user=user,
            user_permissions=user_permissions,
            org_units=org_units,
            user_roles=user_roles_data["user_roles"],
            user_roles_groups=user_roles_data["groups"],
            projects=projects,
            editable_org_unit_types=editable_org_unit_types,
        )

        dhis2_id = request.data.get("dhis2_id", None)
        if dhis2_id == "":
            dhis2_id = None
        profile.dhis2_id = dhis2_id

        profile.phone_number = self.extract_phone_number(request)

        profile.save()

        audit_logger = ProfileAuditLogger()
        source = f"{PROFILE_API}_mobile" if is_mobile_request(request) else PROFILE_API
        audit_logger.log_modification(instance=profile, old_data_dump=None, request_user=request.user, source=source)

        # send an email invitation to new user when the send_email_invitation checkbox has been checked
        # and the email adresse has been given
        if send_email_invitation and profile.user.email:
            email_subject = self.get_subject_by_language(self, request.data.get("language"))
            email_message = self.get_message_by_language(self, request.data.get("language"))
            email_html_message = self.get_html_message_by_language(self, request.data.get("language"))
            self.send_email_invitation(profile, email_subject, email_message, email_html_message)

        return Response(user.profile.as_dict())

    @atomic
    def partial_update(self, request, pk=None):
        if pk == PK_ME:
            return self.update_user_own_profile(request)

        profile = get_object_or_404(self.get_queryset(), id=pk)
        user = profile.user
        # profile.account is safe to use because we never update it through the API
        current_account = user.iaso_profile.account
        audit_logger = ProfileAuditLogger()
        old_data = audit_logger.serialize_instance(profile)
        source = f"{PROFILE_API}_mobile" if is_mobile_request(request) else PROFILE_API
        # Validation
        try:
            self.validate_user_name(request, user)
            user_permissions = self.validate_user_permissions(request, current_account)
            org_units = self.validate_org_units(request, profile)
            user_roles_data = self.validate_user_roles(request)
            projects = self.validate_projects(request, profile)
            editable_org_unit_types = self.validate_editable_org_unit_types(request, profile)
        except ProfileError as error:
            return JsonResponse(
                {"errorKey": error.field, "errorMessage": error.detail},
                status=status.HTTP_400_BAD_REQUEST,
            )

        profile = self.update_user_profile(
            request=request,
            profile=profile,
            user=user,
            user_permissions=user_permissions,
            org_units=org_units,
            user_roles=user_roles_data["user_roles"],
            user_roles_groups=user_roles_data["groups"],
            projects=projects,
            editable_org_unit_types=editable_org_unit_types,
        )

        audit_logger.log_modification(
            instance=profile, old_data_dump=old_data, request_user=request.user, source=source
        )

        return Response(profile.as_dict())

    def delete(self, request, pk=None):
        profile = get_object_or_404(self.get_queryset(), id=pk)
        user = profile.user
        # TODO log after actual deletion
        audit_logger = ProfileAuditLogger()
        source = f"{PROFILE_API}_mobile" if is_mobile_request(request) else PROFILE_API
        audit_logger.log_hard_deletion(instance=profile, request_user=request.user, source=source)
        user.delete()
        profile.delete()
        return Response(True)

    @staticmethod
    def update_user_own_profile(request):
        audit_logger = ProfileAuditLogger()
        # allow user to change his own language
        profile = request.user.iaso_profile
        old_data = audit_logger.serialize_instance(profile)
        if "home_page" in request.data:
            profile.home_page = request.data["home_page"]
        if "language" in request.data:
            profile.language = request.data["language"]
        profile.save()
        source = f"{PROFILE_API}_mobile_me" if is_mobile_request(request) else f"{PROFILE_API}_me"
        audit_logger.log_modification(
            instance=profile, old_data_dump=old_data, request_user=request.user, source=source
        )
        return Response(profile.as_dict())

    def update_user_profile(
        self,
        request,
        profile,
        user,
        user_roles,
        user_roles_groups,
        projects,
        org_units,
        user_permissions,
        editable_org_unit_types,
    ):
        if TenantUser.is_multi_account_user(user):
            # In multi-tenant mode, `main_user` is the user who logs in.
            self.update_password(user.tenant_user.main_user, request)
        else:
            user.first_name = request.data.get("first_name", "")
            user.last_name = request.data.get("last_name", "")
            user.username = request.data.get("user_name")
            user.email = request.data.get("email", "")
            self.update_password(user, request)

        user.groups.set(user_roles_groups)
        user.save()
        user.user_permissions.set(user_permissions)

        profile.phone_number = self.extract_phone_number(request)

        profile.language = request.data.get("language", "")
        profile.organization = request.data.get("organization", None)
        profile.home_page = request.data.get("home_page", "")
        profile.dhis2_id = request.data.get("dhis2_id", "")
        if profile.dhis2_id == "":
            profile.dhis2_id = None

        profile.user_roles.set(user_roles)
        profile.projects.set(projects)
        profile.org_units.set(org_units)
        profile.editable_org_unit_types.set(editable_org_unit_types)
        profile.save()
        return profile

    @staticmethod
    def list_export(
        queryset: "QuerySet[Profile]", file_format: FileFormatEnum
    ) -> Union[HttpResponse, StreamingHttpResponse]:
        columns = [{"title": column} for column in ["user_profile_id"] + BULK_CREATE_USER_COLUMNS_LIST]

        def get_row(profile: Profile, **_) -> List[Any]:
            org_units = profile.org_units.order_by("id").only("id", "source_ref")
            editable_org_unit_types_pks = profile.editable_org_unit_types.order_by("id").values_list("id", flat=True)

            return [
                profile.id,
                profile.user.username,
                "",  # Password is left empty on purpose.
                profile.user.email,
                profile.user.first_name,
                profile.user.last_name,
                ",".join(str(item.pk) for item in org_units),
                ",".join(item.source_ref for item in org_units if item.source_ref),
                profile.language,
                profile.dhis2_id,
                profile.organization,
                ",".join(item.codename for item in profile.user.user_permissions.all()),
                ",".join(
                    item.group.name.removeprefix(f"{profile.account.pk}_")
                    for item in profile.user_roles.all().order_by("id")
                ),
                ",".join(str(item.name) for item in profile.projects.all().order_by("id")),
                (f"'{profile.phone_number}'" if profile.phone_number else None),
                ",".join(str(pk) for pk in editable_org_unit_types_pks),
            ]

        filename = "users"
        response: Union[HttpResponse, StreamingHttpResponse]
        queryset = queryset.order_by("id")

        if file_format == FileFormatEnum.XLSX:
            filename = filename + ".xlsx"
            response = HttpResponse(
                generate_xlsx("Users", columns, queryset, get_row),
                content_type=CONTENT_TYPE_XLSX,
            )
        elif file_format == FileFormatEnum.CSV:
            filename = f"{filename}.csv"
            response = StreamingHttpResponse(
                streaming_content=(iter_items(queryset, Echo(), columns, get_row)), content_type=CONTENT_TYPE_CSV
            )
        else:
            raise ValueError(f"Unknown file format requested: {file_format}")

        response["Content-Disposition"] = "attachment; filename=%s" % filename
        return response

    def validate_user_name(self, request, user):
        if TenantUser.is_multi_account_user(user):
            return  # username cannot be updated for multi-account users

        username = request.data.get("user_name")
        if not username:
            raise ProfileError(field="user_name", detail=_("Nom d'utilisateur requis"))

        existing_user = User.objects.filter(username__iexact=username).filter(~Q(pk=user.id))
        if existing_user:
            # Prevent from username change with existing username
            raise ProfileError(field="user_name", detail=_("Nom d'utilisateur existant"))

    def validate_user_permissions(self, request, current_account):
        user_permissions = []
        module_permissions = [perm.codename for perm in current_account.permissions_from_active_modules]
        valid_permissions = []
        for permission_codename in request.data.get("user_permissions", []):
            if permission_codename in module_permissions:
                user_permissions.append(get_object_or_404(Permission, codename=permission_codename))
                valid_permissions.append(permission_codename)
        # Making sure that this user can actually assign those permissions
        raise_error_if_user_lacks_admin_permission(request.user, valid_permissions)
        return user_permissions

    def validate_org_units(self, request, profile) -> QuerySet[OrgUnit]:
        org_unit = request.data.get("org_units", [])
        if not org_unit:
            return OrgUnit.objects.none()

        # Convert the ids received from the APIs to int.
        org_unit_ids = []
        for ou in org_unit:
            try:
                org_unit_ids.append(int(ou["id"]))
            except (KeyError, ValueError):
                pass
        org_unit_ids = set(org_unit_ids)
        existing_org_unit_ids = set(profile.org_units.values_list("id", flat=True))

        if org_unit_ids == existing_org_unit_ids:
            # No change detected, the user must be trying to change another field.
            return OrgUnit.objects.filter(id__in=org_unit_ids)

        filtered_org_unit_ids = []
        if request.user.has_perm(CORE_USERS_MANAGED_PERMISSION.full_name()) and not request.user.has_perm(
            CORE_USERS_ADMIN_PERMISSION.full_name()
        ):
            profile_org_units = request.user.iaso_profile.org_units.all()
            managed_org_units = OrgUnit.objects.hierarchy(profile_org_units).values_list("id", flat=True)
            # Only filter if there's an org unit limitation in place.
            if profile_org_units.exists():
                for org_unit_id in org_unit_ids:
                    if (
                        org_unit_id not in list(managed_org_units)
                        and org_unit_id not in existing_org_unit_ids
                        and not request.user.is_superuser
                    ):
                        raise PermissionDenied(
                            f"User with {CORE_USERS_MANAGED_PERMISSION} cannot assign an OrgUnit outside of their own health "
                            f"pyramid. Trying to assign {org_unit_id}."
                        )
                    filtered_org_unit_ids.append(org_unit_id)

        valid_ids = filtered_org_unit_ids or org_unit_ids
        org_units = OrgUnit.objects.filter(id__in=valid_ids)

        return org_units

    def validate_user_roles(self, request):
        result = {"groups": [], "user_roles": []}
        user_roles = request.data.get("user_roles", [])
        # Get the current connected user
        current_profile = request.user.iaso_profile
        for user_role_id in user_roles:
            # Get only a user role linked to the account's user
            user_role_item = get_object_or_404(UserRole, pk=user_role_id, account=current_profile.account)
            user_group_item = get_object_or_404(models.Group, pk=user_role_item.group_id)
            # Checking if that user can receive that role
            role_permission_names = user_group_item.permissions.values_list("codename", flat=True)
            raise_error_if_user_lacks_admin_permission(request.user, role_permission_names)
            result["groups"].append(user_group_item)
            result["user_roles"].append(user_role_item)
        return result

    def validate_projects(self, request: HttpRequest, profile: Profile) -> list:
        new_project_ids = set([pk for pk in request.data.get("projects", []) if str(pk).isdigit()])

        if request.user.has_perm(CORE_USERS_ADMIN_PERMISSION.full_name()):
            return Project.objects.filter(id__in=new_project_ids, account=profile.account_id)

        user_restricted_projects_ids = set(request.user.iaso_profile.projects_ids)

        if not new_project_ids:
            if user_restricted_projects_ids:
                raise PermissionDenied("You must specify which projects are authorized for this user.")
            return []  # No project restrictions.

        if not user_restricted_projects_ids:
            return Project.objects.filter(id__in=new_project_ids, account=profile.account_id)

        profile_restricted_projects_ids = set(profile.projects_ids)
        if profile_restricted_projects_ids > user_restricted_projects_ids:
            raise PermissionDenied("You cannot edit a user who has broader access to projects.")

        if new_project_ids.issubset(user_restricted_projects_ids):
            return Project.objects.filter(id__in=new_project_ids, account=profile.account_id)

        raise PermissionDenied("Some projects are outside your scope.")

    def validate_editable_org_unit_types(self, request, profile: Profile) -> QuerySet[OrgUnitType]:
        editable_org_unit_type_ids = set(request.data.get("editable_org_unit_type_ids", []))
        editable_org_unit_types = OrgUnitType.objects.filter(pk__in=editable_org_unit_type_ids)
        existing_editable_org_unit_type_ids = set(profile.editable_org_unit_types.values_list("id", flat=True))

        if editable_org_unit_type_ids == existing_editable_org_unit_type_ids:
            # No change detected, the user must be trying to change another field.
            return editable_org_unit_types

        if editable_org_unit_types.count() != len(editable_org_unit_type_ids):
            raise ValidationError("Invalid editable org unit type submitted.")

        return editable_org_unit_types

    @staticmethod
    def extract_phone_number(request):
        phone_number = request.data.get("phone_number")
        country_code = request.data.get("country_code")
        number = ""

        if any([phone_number, country_code]) and not all([phone_number, country_code]):
            raise ValidationError({"phone_number": _("Both phone number and country code must be provided")})

        if phone_number and country_code:
            try:
                number = PhoneNumber.from_string(phone_number, region=country_code.upper())
            except NumberParseException:
                raise ValidationError({"phone_number": _("Invalid phone number format")})

            if not number.is_valid():
                raise ValidationError({"phone_number": _("Invalid phone number")})

        return number

    @staticmethod
    def update_password(user, request):
        password = request.data.get("password", "")
        if password != "":
            user.set_password(password)
            user.save()
        if password and request.user == user:
            # update session hash if you changed your own password, so you don't get logged out
            # https://docs.djangoproject.com/en/3.2/topics/auth/default/#session-invalidation-on-password-change
            update_session_auth_hash(request, user)

    def send_email_invitation(self, profile, email_subject, email_message, email_html_message):
        domain = settings.DNS_DOMAIN
        token_generator = PasswordResetTokenGenerator()
        token = token_generator.make_token(profile.user)

        uid = urlsafe_base64_encode(force_bytes(profile.user.pk))
        create_password_path = reverse("reset_password_confirmation", kwargs={"uidb64": uid, "token": token})

        protocol = "https" if self.request.is_secure() else "http"
        email_message_text = email_message.format(
            userName=profile.user.username,
            url=f"{protocol}://{domain}{create_password_path}",
            protocol=protocol,
            domain=domain,
            account_name=profile.account.name,
        )

        email_subject_text = email_subject.format(domain=f"{domain}")
        html_email_template = Template(email_html_message)
        html_email_context = Context(
            {
                "protocol": protocol,
                "domain": domain,
                "account_name": profile.account.name,
                "userName": profile.user.username,
                "url": f"{protocol}://{domain}{create_password_path}",
            }
        )

        rendered_html_email = html_email_template.render(html_email_context)

        send_mail(
            email_subject_text,
            email_message_text,
            settings.DEFAULT_FROM_EMAIL,
            [profile.user.email],
            html_message=rendered_html_email,
        )

    @staticmethod
    def get_message_by_language(self, language="en"):
        return self.CREATE_PASSWORD_MESSAGE_FR if language == "fr" else self.CREATE_PASSWORD_MESSAGE_EN

    @staticmethod
    def get_html_message_by_language(self, language="en"):
        return self.CREATE_PASSWORD_HTML_MESSAGE_FR if language == "fr" else self.CREATE_PASSWORD_HTML_MESSAGE_EN

    @staticmethod
    def get_subject_by_language(self, language="en"):
        return self.EMAIL_SUBJECT_FR if language == "fr" else self.EMAIL_SUBJECT_EN

    CREATE_PASSWORD_MESSAGE_EN = """Hello,

You have been invited to access IASO - {protocol}://{domain}.

Username: {userName} 

Please click on the link below to create your password:

{url}

If clicking the link above doesn't work, please copy and paste the URL in a new browser
window instead.

If you did not request an account on {account_name}, you can ignore this e-mail - no password will be created.

Sincerely,
The {domain} Team.
    """

    CREATE_PASSWORD_HTML_MESSAGE_EN = """<p>Hello,<br><br>

You have been invited to access IASO - <a href="{{protocol}}://{{domain}}" target="_blank">{{account_name}}</a>.<br><br>

Username: <strong>{{userName}}</strong><br><br>

Please click on the link below to create your password:<br><br>

<a href="{{url}}" target="_blank">{{url}}</a><br><br>

If clicking the link above doesn't work, please copy and paste the URL in a new browser<br>
window instead.<br><br>

If you did not request an account on {{account_name}}, you can ignore this e-mail - no password will be created.<br><br>

Sincerely,<br>
The {{domain}} Team.</p>
    """

    CREATE_PASSWORD_MESSAGE_FR = """Bonjour, 

Vous avez été invité à accéder à l'IASO - {protocol}://{domain}.

Nom d'utilisateur: {userName}

Pour configurer un mot de passe pour votre compte, merci de cliquer sur le lien ci-dessous :

{url}

Si le lien ne fonctionne pas, merci de copier et coller l'URL dans une nouvelle fenêtre de votre navigateur.

Si vous n'avez pas demandé de compte sur {account_name}, vous pouvez ignorer cet e-mail - aucun mot de passe ne sera créé.

Cordialement,
L'équipe {domain}.
    """

    CREATE_PASSWORD_HTML_MESSAGE_FR = """<p>Bonjour,<br><br>

Vous avez été invité à accéder à l'IASO - <a href="{{protocol}}://{{domain}}" target="_blank">{{account_name}}</a>.<br><br>

Nom d'utilisateur: <strong>{{userName}}</strong><br><br>

Pour configurer un mot de passe pour votre compte, merci de cliquer sur le lien ci-dessous :<br><br>

<a href="{{url}}" target="_blank">{{url}}</a><br><br>

Si le lien ne fonctionne pas, merci de copier et coller l'URL dans une nouvelle fenêtre de votre navigateur.<br><br>

Si vous n'avez pas demandé de compte sur {{account_name}}, vous pouvez ignorer cet e-mail - aucun mot de passe ne sera créé.<br><br>

Cordialement,<br>
L'équipe {{domain}}.</p>
    """

    EMAIL_SUBJECT_FR = "Configurer un mot de passe pour votre nouveau compte sur {domain}"
    EMAIL_SUBJECT_EN = "Set up a password for your new account on {domain}"
