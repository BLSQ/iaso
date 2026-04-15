from typing import Any, List, Union

from django.conf import settings
from django.contrib.auth import update_session_auth_hash
from django.contrib.auth.models import Permission
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.core.mail import send_mail
from django.db import transaction
from django.db.models import Min, Prefetch, QuerySet
from django.db.transaction import atomic
from django.http import Http404, HttpResponse, StreamingHttpResponse
from django.template.loader import render_to_string
from django.urls import reverse
from django.utils import translation
from django.utils.crypto import get_random_string
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from django.utils.translation import gettext as _
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from rest_framework import permissions, status
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter
from rest_framework.response import Response

from hat.api.export_utils import Echo, generate_xlsx, iter_items
from hat.audit.models import PROFILE_API
from iaso.api.bulk_create_users.constants import BULK_CREATE_USER_COLUMNS_LIST
from iaso.api.common import CONTENT_TYPE_CSV, CONTENT_TYPE_XLSX, FileFormatEnum, ModelViewSet
from iaso.api.profiles.audit import ProfileAuditLogger
from iaso.api.profiles.constants import PK_ME
from iaso.api.profiles.filters import ProfileListFilter
from iaso.api.profiles.pagination import ProfileDropdownPagination, ProfilePagination
from iaso.api.profiles.permissions import HasProfilePermission
from iaso.api.profiles.policies import (
    GroupFromUserRolesPolicy,
    ManagedUsersPolicy,
    OrgUnitPolicy,
    ProjectsPolicy,
    UserPermissionsPolicy,
)
from iaso.api.profiles.serializers import (
    ProfileCreateSerializer,
    ProfileListSerializer,
    ProfileRetrieveSerializer,
    ProfileUpdateSerializer,
    ProfileUserFallbackRetrieveSerializer,
)
from iaso.api.profiles.serializers.dropdown import ProfileDropdownSerializer
from iaso.api.profiles.serializers.update import ProfileMeUpdateSerializer, ProfileUpdatePasswordSerializer
from iaso.models import OrgUnit, Profile, TenantUser, UserRole
from iaso.permissions.core_permissions import CORE_USERS_ADMIN_PERMISSION, CORE_USERS_MANAGED_PERMISSION
from iaso.utils import is_mobile_request


@extend_schema(tags=["Profiles", "Users"])
class ProfilesViewSet(ModelViewSet):
    f"""Profiles API

    This API is restricted to authenticated users having the "{CORE_USERS_ADMIN_PERMISSION}" or "{CORE_USERS_MANAGED_PERMISSION}"
    permission for write core_permissions.
    Read access is accessible to any authenticated users as it necessary to list profile or display a particular one in
    the interface.

    Any logged user can also edit his profile to set his language.

    GET /api/profiles/
    GET /api/profiles/me => current user
    GET /api/profiles/dropdown/
    GET /api/profiles/<id>
    GET /api/profiles/export-csv/
    GET /api/profiles/export-xlsx/
    POST /api/profiles/
    PATCH /api/profiles/me => current user, can only set language field
    PATCH /api/profiles/<id>
    DELETE /api/profiles/<id>
    DELETE /api/profiles/me => current user
    """

    http_method_names = ["get", "post", "patch", "put", "delete", "head", "options", "trace"]
    permission_classes = [permissions.IsAuthenticated, HasProfilePermission]
    pagination_class = ProfilePagination
    filter_backends = [OrderingFilter, DjangoFilterBackend]
    filterset_class = ProfileListFilter
    ordering = ["id"]  # default ordering
    ordering_fields = ["id", "user__username", "annotated_first_user_role"]

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ProfileRetrieveSerializer
        if self.action == "create":
            return ProfileCreateSerializer
        if self.action == "list":
            return ProfileListSerializer
        if self.action in ["update", "partial_update"]:
            if self.kwargs.get(self.lookup_url_kwarg or self.lookup_field, "") == PK_ME:
                return ProfileMeUpdateSerializer
            return ProfileUpdateSerializer
        if self.action in ["update_password"]:
            return ProfileUpdatePasswordSerializer
        if self.action == "dropdown":
            return ProfileDropdownSerializer

        raise NotImplementedError(f"Serializer not implemented for action {self.action}")

    def get_queryset(self):
        account = self.request.user.iaso_profile.account
        qs = Profile.objects.filter(account=account).with_editable_org_unit_types()

        if self.action == "list":
            if self.request.query_params.get("managedUsersOnly", "").lower() in ["true", "1"]:
                qs = ManagedUsersPolicy.authorize_list(self.request.user, qs)

            qs = (
                qs.annotate(
                    # Adds a sortable field containing each user's alphabetically first role name,
                    # enabling consistent frontend sorting of users with multiple roles.
                    annotated_first_user_role=Min("user_roles__group__name")
                )
                .select_related("user", "user__tenant_user")
                .prefetch_related(
                    Prefetch("user_roles", queryset=UserRole.objects.select_related("group").order_by("group__name")),
                    Prefetch(
                        "user__user_permissions",
                        queryset=Permission.objects.filter(codename__startswith="iaso_").only("codename"),
                        to_attr="iaso_permissions",
                    ),
                    "user__teams",
                    Prefetch("org_units", queryset=OrgUnit.objects.order_by("name")),
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
            )
        return qs

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

    @action(detail=False, methods=["get"], url_path="export-csv", url_name="export-csv")
    def export_csv(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        return self.list_export(queryset, file_format=FileFormatEnum.CSV)

    @action(detail=False, methods=["get"], url_path="export-xlsx", url_name="export-xlsx")
    def export_xlsx(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        return self.list_export(queryset, file_format=FileFormatEnum.XLSX)

    @action(detail=True, methods=["patch", "put"], url_path="update-password", url_name="update-password")
    def update_password(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = instance.user

        if TenantUser.is_multi_account_user(user):
            self.perform_update_password(user.tenant_user.main_user, serializer.validated_data["password"])
            user.tenant_user.main_user.save()
        else:
            self.perform_update_password(user, serializer.validated_data["password"])
            user.save()

        if self.request.user == user:
            update_session_auth_hash(self.request, user)

        return Response(status=status.HTTP_204_NO_CONTENT)

    def _post_create_user(self, password, user, send_email_invitation, first_name, last_name, user_name, email):
        if password:
            user.set_password(password)
        elif send_email_invitation:
            random_password = get_random_string(32)
            user.set_password(random_password)

        if not TenantUser.is_multi_account_user(user):
            user.first_name = first_name
            user.last_name = last_name
            if user_name:
                user.username = user_name
            user.email = email

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
        self._post_create_user(
            user=profile.user,
            password=serializer.validated_data.get("password", ""),
            send_email_invitation=serializer.validated_data.get("send_email_invitation", False),
            email=serializer.validated_data.get("email", ""),
            first_name=serializer.validated_data.get("first_name", ""),
            user_name=serializer.validated_data.get("user_name", ""),
            last_name=serializer.validated_data.get("last_name", ""),
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
        language = serializer.validated_data.get("language", settings.LANGUAGE_CODE)

        if send_invite and email:
            transaction.on_commit(lambda: self.send_email_invitation(profile, language))

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # run the advanced checks : authorization/policy validation
        OrgUnitPolicy.authorize_create(self.request.user, serializer.validated_data.get("org_units", None) or [])
        GroupFromUserRolesPolicy.authorize(
            requester=self.request.user, user_roles=serializer.validated_data.get("user_roles", None) or []
        )
        UserPermissionsPolicy.authorize_create(
            requester=self.request.user, user_permissions=serializer.validated_data.get("user_permissions", None) or []
        )
        ProjectsPolicy.authorize_create(
            requester=self.request.user, projects=serializer.validated_data.get("projects", None) or []
        )

        # from super().create() to avoid calling again the serializer
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_update_password(self, user, password):
        user.set_password(password)

        if self.request.user == user:
            update_session_auth_hash(self.request, user)

    def _post_update_user(self, user, serializer_data):
        if "password" in serializer_data and serializer_data.get("password"):
            if TenantUser.is_multi_account_user(user):
                self.perform_update_password(user.tenant_user.main_user, serializer_data["password"])
                user.tenant_user.main_user.save()
            else:
                self.perform_update_password(user, serializer_data["password"])

        if not TenantUser.is_multi_account_user(user):
            if "first_name" in serializer_data:
                user.first_name = serializer_data["first_name"]
            if "last_name" in serializer_data:
                user.last_name = serializer_data["last_name"]
            if "user_name" in serializer_data and serializer_data.get("user_name"):
                user.username = serializer_data.get("user_name")
            if "email" in serializer_data:
                user.email = serializer_data["email"]

    def perform_update(self, serializer):
        # pre-audit
        audit_logger = ProfileAuditLogger()
        old_data = audit_logger.serialize_instance(self.get_object())

        # perform update
        profile = serializer.save()

        # post-update groups
        if "user_roles" in serializer.validated_data:
            roles = serializer.validated_data.get("user_roles") or []
            groups = {role.group for role in roles}

            profile.user.groups.set(groups)

        # post-update user permissions
        if "user_permissions" in serializer.validated_data:
            user_permissions = serializer.validated_data.get("user_permissions") or []
            profile.user.user_permissions.set(user_permissions)

        # post-update user profile
        self._post_update_user(user=profile.user, serializer_data=serializer.validated_data)

        # save
        profile.user.save()

        # post-audit
        source = f"{PROFILE_API}_mobile" if is_mobile_request(self.request) else PROFILE_API

        if self.kwargs.get(self.lookup_url_kwarg or self.lookup_field, "") == PK_ME:
            source = f"{PROFILE_API}_mobile_me" if is_mobile_request(self.request) else f"{PROFILE_API}_me"

        audit_logger.log_modification(
            instance=profile, old_data_dump=old_data, request_user=self.request.user, source=source
        )

    @atomic
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)

        # run the advanced checks : authorization/policy validation
        UserPermissionsPolicy.authorize_update(
            requester=self.request.user, user_permissions=serializer.validated_data.get("user_permissions", None) or []
        )
        ProjectsPolicy.authorize_update(
            requester=self.request.user,
            profile=instance,
            new_project_ids=serializer.validated_data.get("projects", None) or [],
        )
        GroupFromUserRolesPolicy.authorize(
            requester=self.request.user, user_roles=serializer.validated_data.get("user_roles", None) or []
        )
        if "org_units" in serializer.validated_data and not getattr(serializer, "_org_units_unchanged", False):
            OrgUnitPolicy.authorize_update(
                requester=request.user,
                profile=instance,
                new_org_unit_ids={ou.id for ou in serializer.validated_data["org_units"]},
            )

        # from super().update to avoid the get_object and serializer again
        self.perform_update(serializer)

        if getattr(instance, "_prefetched_objects_cache", None):
            # If 'prefetch_related' has been applied to a queryset, we need to
            # forcibly invalidate the prefetch cache on the instance.
            instance._prefetched_objects_cache = {}

        return Response(serializer.data)

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

    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)

    def send_email_invitation(self, profile, language):
        domain = settings.DNS_DOMAIN
        protocol = "https" if self.request.is_secure() else "http"

        token_generator = PasswordResetTokenGenerator()
        token = token_generator.make_token(profile.user)
        uid = urlsafe_base64_encode(force_bytes(profile.user.pk))
        create_password_path = reverse("reset_password_confirmation", kwargs={"uidb64": uid, "token": token})

        email_subject = self.get_subject_by_language(language, domain)

        with translation.override(language):
            email_message = render_to_string(
                "emails/create_password_email.txt",
                context={
                    "protocol": protocol,
                    "domain": domain,
                    "account_name": profile.account.name,
                    "user_name": profile.user.username,
                    "url": f"{protocol}://{domain}{create_password_path}",
                },
            )

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

    @staticmethod
    def get_subject_by_language(language=settings.LANGUAGE_CODE, domain=settings.DNS_DOMAIN):
        with translation.override(language):
            return _("Set up a password for your new account on {domain}").format(domain=domain)

    @action(detail=False, methods=["get"], pagination_class=ProfileDropdownPagination)
    def dropdown(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(sorted(serializer.data, key=lambda x: x["label"].lower()))
