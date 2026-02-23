from typing import Any, List, Optional, Union

from django.conf import settings
from django.contrib.auth import update_session_auth_hash
from django.contrib.auth.models import User
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core.mail import send_mail
from django.db import transaction
from django.db.models import Min, Q, QuerySet
from django.db.transaction import atomic
from django.http import Http404, HttpResponse, JsonResponse, StreamingHttpResponse
from django.shortcuts import get_object_or_404
from django.template.loader import render_to_string
from django.urls import reverse
from django.utils import translation
from django.utils.crypto import get_random_string
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from django.utils.translation import gettext as _
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import permissions, serializers, status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.filters import OrderingFilter
from rest_framework.response import Response

from hat.api.export_utils import Echo, generate_xlsx, iter_items
from hat.audit.models import PROFILE_API
from iaso.api.common import CONTENT_TYPE_CSV, CONTENT_TYPE_XLSX, FileFormatEnum, ModelViewSet
from iaso.api.profiles.audit import ProfileAuditLogger
from iaso.api.profiles.bulk_create_users import BULK_CREATE_USER_COLUMNS_LIST
from iaso.api.profiles.filters import ProfileListFilter
from iaso.api.profiles.pagination import ProfilePagination
from iaso.api.profiles.policies import GroupFromUserRolesPolicy, OrgUnitPolicy, ProjectsPolicy, UserPermissionsPolicy
from iaso.api.profiles.serializers import (
    ProfileCreateSerializer,
    ProfileListSerializer,
    ProfileRetrieveSerializer,
    ProfileUserFallbackRetrieveSerializer,
)
from iaso.models import OrgUnit, Profile, TenantUser
from iaso.permissions.core_permissions import CORE_USERS_ADMIN_PERMISSION, CORE_USERS_MANAGED_PERMISSION
from iaso.utils import is_mobile_request, search_by_ids_refs
from iaso.utils.colors import COLOR_FORMAT_ERROR, DEFAULT_COLOR, validate_hex_color


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


class ProfileColorUpdateSerializer(serializers.Serializer):
    color = serializers.CharField()

    def validate_color(self, value: str) -> str:
        try:
            return validate_hex_color(value)
        except ValueError:
            raise serializers.ValidationError(COLOR_FORMAT_ERROR)


class ProfilesViewSet(ModelViewSet):
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
    DELETE /api/profiles/me => current user
    """

    http_method_names = ["get", "post", "patch", "delete", "head", "options", "trace"]
    permission_classes = [permissions.IsAuthenticated, HasProfilePermission]
    pagination_class = ProfilePagination

    filter_backends = [OrderingFilter, DjangoFilterBackend]
    filterset_class = ProfileListFilter
    ordering_filters = ["user__username"]

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ProfileRetrieveSerializer
        if self.action == "create":
            return ProfileCreateSerializer
        if self.action == "list":
            return ProfileListSerializer
        raise NotImplementedError(f"Serializer not implemented for action {self.action}")

    def get_queryset(self):
        account = self.request.user.iaso_profile.account
        return Profile.objects.filter(account=account).with_editable_org_unit_types()

    def get_object(self):
        if self.kwargs.get(self.lookup_field, "") == PK_ME:
            return self.filter_queryset(self.get_queryset()).get(user=self.request.user)
        return super().get_object()

    def retrieve(self, request, *args, **kwargs):
        try:
            return super().retrieve(request, *args, **kwargs)
        except Profile.DoesNotExist:
            if kwargs.get(self.lookup_field, "") == PK_ME:
                serializer = ProfileUserFallbackRetrieveSerializer(instance=self.request.user)
                return Response(serializer.data, status=status.HTTP_200_OK)
            raise Http404

    @action(detail=False, methods=["get"], url_path="export-csv")
    def export_csv(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        return self.list_export(queryset, file_format=FileFormatEnum.CSV)

    @action(detail=False, methods=["get"], url_path="export-xlsx")
    def export_xlsx(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        return self.list_export(queryset, file_format=FileFormatEnum.XLSX)

    def list(self, request, *args, **kwargs):
        search = request.GET.get("search", None)

        location = request.GET.get("location", None)
        org_unit_type = request.GET.get("orgUnitTypes", None)
        parent_ou = request.GET.get("ouParent", None) == "true"
        children_ou = request.GET.get("ouChildren", None) == "true"

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
            "user__teams",
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

        return Response({"profiles": [profile.as_short_dict() for profile in queryset]})

    def _post_create_set_user_password(self, password, user, send_email_invitation):
        if password:
            user.set_password(password)
        elif send_email_invitation:
            random_password = get_random_string(32)
            user.set_password(random_password)

    def perform_create(self, serializer):
        profile = serializer.save()

        # post-create groups
        roles = serializer.validated_data.get("user_roles") or []
        groups = {role.group for role in roles}

        profile.user.groups.set(groups)

        # post-create user permissions
        user_permissions = serializer.validated_data.get("user_permissions") or []
        profile.user.user_permissions.set(user_permissions)

        # post-create user profile
        self._post_create_set_user_password(
            user=profile.user,
            password=serializer.validated_data.get("password", ""),
            send_email_invitation=serializer.validated_data.get("send_email_invitation", False),
        )

        # save
        profile.user.save()

        # audit
        audit_logger = ProfileAuditLogger()
        source = f"{PROFILE_API}_mobile" if is_mobile_request(self.request) else PROFILE_API
        audit_logger.log_modification(
            instance=profile, old_data_dump=None, request_user=self.request.user, source=source
        )

        # send email
        send_invite = serializer.validated_data.get("send_email_invitation")
        email = serializer.validated_data.get("email")
        language = serializer.validated_data.get("language")

        if send_invite and email:
            transaction.on_commit(lambda: self.send_email_invitation(profile, language))

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """
        Big change for org_unit: from [
        {"id": 1}
        ] to [1]
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # run the advanced checks : authorization/policy validation
        OrgUnitPolicy.validate_create(self.request.user, serializer.validated_data.get("org_units", None) or [])
        GroupFromUserRolesPolicy.authorize(
            user=self.request.user, user_roles=serializer.validated_data.get("user_roles", None) or []
        )
        UserPermissionsPolicy.create(
            user=self.request.user, user_permissions=serializer.validated_data.get("user_permissions", None) or []
        )
        ProjectsPolicy.create(user=self.request.user, projects=serializer.validated_data.get("projects", None) or [])

        return super().create(request, *args, **kwargs)

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
            color = self.validate_color(request)
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
            color=color,
        )

        audit_logger.log_modification(
            instance=profile, old_data_dump=old_data, request_user=request.user, source=source
        )

        return Response(profile.as_dict())

    @action(detail=True, methods=["PATCH"])
    def update_color(self, request, pk=None):
        """
        TODO: Remove this action once the profile PATCH is refactored to avoid
        overwriting other fields when they are not provided.
        """
        serializer = ProfileColorUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile = get_object_or_404(self.get_queryset(), id=pk)
        audit_logger = ProfileAuditLogger()
        old_data = audit_logger.serialize_instance(profile)

        profile.color = serializer.validated_data["color"]
        profile.save(update_fields=["color"])

        audit_logger.log_modification(
            instance=profile, old_data_dump=old_data, request_user=request.user, source=PROFILE_API
        )

        return Response(profile.as_dict())

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
        color,
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
            user_name = request.data.get("user_name")
            if user_name:
                user.username = user_name
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

        resolved_color = color if color is not None else profile.color or DEFAULT_COLOR
        profile.color = resolved_color

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
                ",".join(item.name for item in profile.user.teams.all().order_by("id")),
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

    @staticmethod
    def update_password(user, request):
        password = request.data.get("password")
        send_email_invitation = request.data.get("send_email_invitation")

        if password:
            user.set_password(password)
            user.save()
        elif send_email_invitation and user.email:
            random_password = get_random_string(32)
            user.set_password(random_password)
            user.save()
        else:
            user.set_unusable_password()
            user.save()

        if password and request.user == user:
            # update session hash if you changed your own password, so you don't get logged out
            # https://docs.djangoproject.com/en/3.2/topics/auth/default/#session-invalidation-on-password-change
            update_session_auth_hash(request, user)

    def send_email_invitation(self, profile, language):
        domain = settings.DNS_DOMAIN
        protocol = "https" if self.request.is_secure() else "http"

        token_generator = PasswordResetTokenGenerator()
        token = token_generator.make_token(profile.user)
        uid = urlsafe_base64_encode(force_bytes(profile.user.pk))
        create_password_path = reverse("reset_password_confirmation", kwargs={"uidb64": uid, "token": token})

        email_subject = self.get_subject_by_language(language, domain)
        email_message = self.get_message_by_language(
            language,
            protocol=protocol,
            domain=domain,
            user_name=profile.user.username,
            url=f"{protocol}://{domain}{create_password_path}",
            account_name=profile.account.name,
        )

        with translation.override(language):
            html_email_content = render_to_string(
                "emails/create_password_email.html",
                context={
                    "protocol": protocol,
                    "domain": domain,
                    "account_name": profile.account.name,
                    "user_name": profile.user.username,
                    "url": f"{protocol}://{domain}{create_password_path}",
                },
            )

        send_mail(
            email_subject,
            email_message,
            settings.DEFAULT_FROM_EMAIL,
            [profile.user.email],
            html_message=html_email_content,
        )

    def perform_destroy(self, instance):
        user = instance.user

        audit_logger = ProfileAuditLogger()
        source = f"{PROFILE_API}_mobile" if is_mobile_request(self.request) else PROFILE_API

        # Log BEFORE deletion while instance still exists
        audit_logger.log_hard_deletion(
            instance=instance,
            request_user=self.request.user,
            source=source,
        )

        # Atomic delete of related objects
        user.delete()
        instance.delete()

    # todo : not sure this atomic is not enabled by default
    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)

    @staticmethod
    def get_message_by_language(language=settings.LANGUAGE_CODE, **kwargs):
        with translation.override(language):
            return _(
                """Hello,

You have been invited to access IASO - {protocol}://{domain}.

Username: {user_name} 

Please click on the link below to create your password:

{url}

If clicking the link above doesn't work, please copy and paste the URL in a new browser
window instead.

If you did not request an account on {account_name}, you can ignore this e-mail - no password will be created.

Sincerely,
The {domain} Team.
    """.format(
                    protocol=kwargs["protocol"],
                    domain=kwargs["domain"],
                    user_name=kwargs["user_name"],
                    url=kwargs["url"],
                    account_name=kwargs["account_name"],
                )
            )

    @staticmethod
    def get_subject_by_language(language=settings.LANGUAGE_CODE, domain=settings.DNS_DOMAIN):
        with translation.override(language):
            return _("Set up a password for your new account on %(domain)s") % {"domain": domain}
