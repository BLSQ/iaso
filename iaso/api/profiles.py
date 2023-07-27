from django.conf import settings
from django.contrib.auth import update_session_auth_hash
from django.contrib.auth.models import Permission
from django.contrib.auth.models import User
from django.contrib.auth import models
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.contrib.sites.shortcuts import get_current_site
from django.core.mail import send_mail
from django.core.paginator import Paginator
from django.db.models import Q, QuerySet
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.urls import reverse
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from django.utils.translation import gettext as _
from rest_framework import viewsets, permissions, status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from typing import Optional, List

from iaso.models import Profile, OrgUnit, UserRole, Project
from hat.menupermissions import models as permission
from hat.menupermissions.models import CustomPermissionSupport

PK_ME = "me"


class HasProfilePermission(permissions.BasePermission):
    def has_permission(self, request, view):
        pk = view.kwargs.get("pk")
        if view.action in ("retrieve", "partial_update") and pk == PK_ME:
            return True
        if request.user.has_perm(permission.USERS_ADMIN):
            return True
        if request.user.has_perm(permission.USERS_MANAGED):
            return self.has_permission_over_user(request, pk)

        return request.method == "GET"

    # We could `return False` instead of raising exceptions,
    # but it's better to be explicit about why the permission was denied.
    @staticmethod
    def has_permission_over_user(request, pk):
        if request.method == "GET":
            return True
        if not pk:
            raise PermissionDenied(f"User with '{permission.USERS_MANAGED}' cannot create users.")

        if pk == request.user.id:
            raise PermissionDenied(f"User with '{permission.USERS_MANAGED}' cannot edit their own permissions.")

        org_units = OrgUnit.objects.hierarchy(request.user.iaso_profile.org_units.all()).values_list("id", flat=True)
        if org_units and len(org_units) > 0:
            profile = get_object_or_404(Profile.objects.filter(account=request.user.iaso_profile.account), pk=pk)
            user_managed_org_units = profile.org_units.filter(id__in=org_units).all()
            if not user_managed_org_units or len(user_managed_org_units) == 0:
                raise PermissionDenied(
                    "The user we are trying to modify is not part of any OrgUnit " "managed by the current user"
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
    managed_users_only: Optional[bool] = False,
) -> QuerySet[Profile]:
    original_queryset = queryset
    if search:
        queryset = queryset.filter(
            Q(user__username__icontains=search)
            | Q(user__first_name__icontains=search)
            | Q(user__last_name__icontains=search)
        ).distinct()

    if perms:
        queryset = queryset.filter(user__user_permissions__codename__in=perms).distinct()

    if location:
        queryset = queryset.filter(
            user__iaso_profile__org_units__pk=location,
        ).distinct()

    parent: Optional[OrgUnit] = None
    if parent_ou and location or children_ou and location:
        ou = get_object_or_404(OrgUnit, pk=location)
        if parent_ou and ou.parent is not None:
            parent = ou.parent

        if parent_ou and not children_ou:
            queryset_current = original_queryset.filter(user__iaso_profile__org_units__pk=location)

            if not parent:
                queryset = queryset_current

            else:
                queryset = (
                    original_queryset.filter(
                        user__iaso_profile__org_units__pk=parent.id,
                    )
                ) | queryset_current

                queryset = queryset.distinct()

        if children_ou and not parent_ou:
            queryset_current = original_queryset.filter(user__iaso_profile__org_units__pk=location)
            children_ous = OrgUnit.objects.filter(parent__pk=location)
            queryset = (
                original_queryset.filter(user__iaso_profile__org_units__in=[ou.pk for ou in children_ous])
                | queryset_current
            )

        if parent_ou and children_ou:
            if not parent:
                queryset_parent = original_queryset.filter(user__iaso_profile__org_units__pk=location)
            else:
                queryset_parent = original_queryset.filter(
                    user__iaso_profile__org_units__pk=parent.pk,
                )

            queryset_current = original_queryset.filter(user__iaso_profile__org_units__pk=location)

            children_ous = OrgUnit.objects.filter(parent__pk=location)
            queryset_children = original_queryset.filter(
                user__iaso_profile__org_units__in=children_ous.values_list("id", flat=True)
            )

            queryset = queryset_current | queryset_parent | queryset_children

    if org_unit_type:
        if org_unit_type == "unassigned":
            queryset = queryset.filter(user__iaso_profile__org_units__org_unit_type__pk=None).distinct()
        else:
            queryset = queryset.filter(user__iaso_profile__org_units__org_unit_type__pk=org_unit_type).distinct()

    if projects:
        queryset = queryset.filter(user__iaso_profile__projects__pk__in=projects)

    if user_roles:
        queryset = queryset.filter(user__iaso_profile__user_roles__pk__in=user_roles)

    if managed_users_only:
        if not user:
            raise Exception("User cannot be 'None' when filtering on managed users only")
        if user.has_perm(permission.USERS_ADMIN):
            queryset = queryset  # no filter needed
        elif user.has_perm(permission.USERS_MANAGED):
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

    This API is restricted to authenticated users having the "{permission.USERS_ADMIN}" or "{permission.USERS_MANAGED}"
    permission for write permission.
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
        return Profile.objects.filter(account=account)

    def list(self, request):
        limit = request.GET.get("limit", None)
        page_offset = request.GET.get("page", 1)
        orders = request.GET.get("order", "user__username").split(",")
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
        managed_users_only = request.GET.get("managedUsersOnly", None) == "true"
        queryset = get_filtered_profiles(
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
            managed_users_only=managed_users_only,
        )

        if limit:
            queryset = queryset.order_by(*orders)
            limit = int(limit)
            page_offset = int(page_offset)
            paginator = Paginator(queryset, limit)
            res = {"count": paginator.count}
            if page_offset > paginator.num_pages:
                page_offset = paginator.num_pages
            page = paginator.page(page_offset)

            res["profiles"] = map(lambda x: x.as_dict(), page.object_list)
            res["has_next"] = page.has_next()
            res["has_previous"] = page.has_previous()
            res["page"] = page_offset
            res["pages"] = paginator.num_pages
            res["limit"] = limit
            return Response(res)
        else:
            return Response({"profiles": [profile.as_short_dict() for profile in queryset]})

    def retrieve(self, request, *args, **kwargs):
        pk = kwargs.get("pk")
        if pk == PK_ME:
            profile = request.user.iaso_profile
            return Response(profile.as_dict())
        else:
            profile = get_object_or_404(self.get_queryset(), pk=pk)
            return Response(profile.as_dict())

    def partial_update(self, request, pk=None):
        if pk == PK_ME:
            return self.update_user_own_profile(request)

        try:
            profile = self.update_user_profile(request, pk)
        except ProfileError as error:
            return JsonResponse(
                {"errorKey": error.field, "errorMessage": error.detail},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user = profile.user

        self.update_password(user, request)
        self.update_permissions(user, request)

        self.update_org_units(profile, request)
        self.update_user_roles(profile, request)
        self.update_projects(profile, request)

        profile.save()

        return Response(profile.as_dict())

    @staticmethod
    def update_user_own_profile(request):
        # allow user to change his own language
        profile = request.user.iaso_profile
        if "home_page" in request.data:
            profile.home_page = request.data["home_page"]
        if "language" in request.data:
            profile.language = request.data["language"]
        profile.save()
        return Response(profile.as_dict())

    def update_user_profile(self, request, pk):
        profile = get_object_or_404(self.get_queryset(), id=pk)
        username = request.data.get("user_name")

        if not username:
            raise ProfileError(field="user_name", detail=_("Nom d'utilisateur requis"))

        user = profile.user
        existing_user = User.objects.filter(username__iexact=username).filter(~Q(pk=user.id))

        if existing_user:
            # Prevent from username change with existing username
            raise ProfileError(field="user_name", detail=_("Nom d'utilisateur existant"))

        user.first_name = request.data.get("first_name", "")
        user.last_name = request.data.get("last_name", "")
        user.username = username
        user.email = request.data.get("email", "")
        profile.language = request.data.get("language", "")
        profile.home_page = request.data.get("home_page", "")
        profile.dhis2_id = request.data.get("dhis2_id", "")
        if profile.dhis2_id == "":
            profile.dhis2_id = None
        profile.save()
        return profile

    @staticmethod
    def update_permissions(user, request):
        user.user_permissions.clear()
        for permission_codename in request.data.get("user_permissions", []):
            CustomPermissionSupport.assert_right_to_assign(request.user, permission_codename)
            user.user_permissions.add(get_object_or_404(Permission, codename=permission_codename))
        user.save()

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

    @staticmethod
    def update_org_units(profile, request):
        org_units = request.data.get("org_units", [])
        # Using list to get the value before we clear the list right after
        existing_org_units = list(profile.org_units.values_list("id", flat=True))
        profile.org_units.clear()
        managed_org_units = None
        if request.user.has_perm(permission.USERS_MANAGED):
            managed_org_units = OrgUnit.objects.hierarchy(request.user.iaso_profile.org_units.all()).values_list(
                "id", flat=True
            )
        for org_unit in org_units:
            org_unit_id = org_unit.get("id")
            if (
                managed_org_units
                and len(managed_org_units) > 0
                and org_unit_id not in managed_org_units
                and org_unit_id not in existing_org_units
            ):
                raise PermissionDenied(
                    f"User with {permission.USERS_MANAGED} cannot assign an OrgUnit outside of their own health "
                    f"pyramid. Trying to assign {org_unit_id}."
                )
            org_unit_item = get_object_or_404(OrgUnit, pk=org_unit_id)
            profile.org_units.add(org_unit_item)

    @staticmethod
    def update_user_roles(profile, request):
        # link the profile to user roles
        user_roles = request.data.get("user_roles", [])
        profile.user_roles.clear()
        profile.user.groups.clear()
        # Get the current connected user
        current_profile = request.user.iaso_profile
        for user_role_id in user_roles:
            # Get only a user role linked to the account's user
            user_role_item = get_object_or_404(UserRole, pk=user_role_id, account=current_profile.account)
            user_group_item = get_object_or_404(models.Group, pk=user_role_item.group_id)
            for p in user_group_item.permissions.all():
                CustomPermissionSupport.assert_right_to_assign(request.user, p.codename)
            profile.user.groups.add(user_group_item)
            profile.user_roles.add(user_role_item)

    @staticmethod
    def update_projects(profile, request):
        projects = request.data.get("projects", [])
        profile.projects.clear()
        for project in projects:
            item = get_object_or_404(Project, pk=project)
            if profile.account_id != item.account_id:
                return JsonResponse({"errorKey": "projects", "errorMessage": _("Unauthorized")}, status=400)
            profile.projects.add(item)

    def send_email_invitation(self, profile, email_subject, email_message):
        current_site = get_current_site(self.request)
        site_name = current_site.name
        domain = current_site.domain
        from_email = settings.DEFAULT_FROM_EMAIL

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
            site_name=site_name,
        )

        email_subject_text = email_subject.format(dns_domain=f"{site_name}")

        send_mail(email_subject_text, email_message_text, from_email, [profile.user.email])

    @staticmethod
    def get_message_by_language(self, language="en"):
        return self.CREATE_PASSWORD_MESSAGE_FR if language == "fr" else self.CREATE_PASSWORD_MESSAGE_EN

    @staticmethod
    def get_subject_by_language(self, language="en"):
        return self.EMAIL_SUBJECT_FR if language == "fr" else self.EMAIL_SUBJECT_EN

    def create(self, request):
        username = request.data.get("user_name")
        password = request.data.get("password", "")
        send_email_invitation = request.data.get("send_email_invitation")

        if not username:
            return JsonResponse({"errorKey": "user_name", "errorMessage": _("Nom d'utilisateur requis")}, status=400)
        if not password and not send_email_invitation:
            return JsonResponse({"errorKey": "password", "errorMessage": _("Mot de passe requis")}, status=400)
        existing_user = User.objects.filter(username__iexact=username)
        if existing_user:
            return JsonResponse({"errorKey": "user_name", "errorMessage": _("Nom d'utilisateur existant")}, status=400)

        user = User()
        user.first_name = request.data.get("first_name", "")
        user.last_name = request.data.get("last_name", "")
        user.username = username
        user.email = request.data.get("email", "")
        permissions = request.data.get("user_permissions", [])
        if password != "":
            user.set_password(password)
        user.save()
        for permission_codename in permissions:
            permission = get_object_or_404(Permission, codename=permission_codename)
            user.user_permissions.add(permission)
        if permissions != []:
            user.save()

        # Create an Iaso profile for the new user and attach it to the same account
        # as the currently authenticated user
        current_profile = request.user.iaso_profile
        user.profile = Profile.objects.create(
            user=user,
            account=current_profile.account,
            language=request.data.get("language", ""),
            home_page=request.data.get("home_page", ""),
        )

        org_units = request.data.get("org_units", [])
        profile = get_object_or_404(Profile, id=user.profile.pk)
        profile.org_units.clear()
        for org_unit in org_units:
            org_unit_item = get_object_or_404(OrgUnit, pk=org_unit.get("id"))
            profile.org_units.add(org_unit_item)

        # link the profile to user roles
        user_roles = request.data.get("user_roles", [])
        for user_role_id in user_roles:
            # Get only a user role linked to the account's user
            user_role_item = get_object_or_404(UserRole, pk=user_role_id, account=current_profile.account)
            user_group_item = get_object_or_404(models.Group, pk=user_role_item.group.id)
            profile.user.groups.add(user_group_item)
            profile.user_roles.add(user_role_item)

        projects = request.data.get("projects", [])
        profile.projects.clear()
        for project in projects:
            item = get_object_or_404(Project, pk=project)
            if profile.account_id != item.account_id:
                return JsonResponse({"errorKey": "projects", "errorMessage": _("Unauthorized")}, status=400)
            profile.projects.add(item)
        dhis2_id = request.data.get("dhis2_id", None)
        if dhis2_id == "":
            dhis2_id = None
        profile.dhis2_id = dhis2_id
        profile.save()

        # send an email invitation to new user when the send_email_invitation checkbox has been checked
        # and the email adresse has been given
        if send_email_invitation and profile.user.email:
            email_subject = self.get_subject_by_language(self, request.data.get("language"))
            email_message = self.get_message_by_language(self, request.data.get("language"))

            self.send_email_invitation(profile, email_subject, email_message)

        return Response(user.profile.as_dict())

    def delete(self, request, pk=None):
        profile = get_object_or_404(self.get_queryset(), id=pk)
        user = profile.user
        user.delete()
        profile.delete()
        return Response(True)

    CREATE_PASSWORD_MESSAGE_EN = """Hello,

You've been invited to access {protocol}://{domain}, and a new account with the username {userName} has been created for you. 

To set up a password for your account, please click on the link:

{url}

If clicking the link above doesn't work, please copy and paste the URL in a new browser
window instead.

If you did not request an account on {domain}, you can ignore this e-mail - no password will be created.

Sincerely,
The {site_name} Team.
    """

    CREATE_PASSWORD_MESSAGE_FR = """Bonjour, 

Vous avez été invité à accéder à {protocol}://{domain} et un nouveau compte avec le nom d'utilisateur {userName} a été créé pour vous.

Pour configurer un mot de passe pour votre compte, merci de cliquer sur le lien ci-dessous :

{url}

Si le lien ne fonctionne pas, merci de copier et coller l'URL dans une nouvelle fenêtre de votre navigateur.

Si vous n'avez pas demandé de compte sur {domain}, vous pouvez ignorer cet e-mail - aucun mot de passe ne sera créé.

Cordialement,
L'équipe {site_name}.
    """

    EMAIL_SUBJECT_FR = "Configurer un mot de passe pour votre nouveau compte sur {dns_domain}"
    EMAIL_SUBJECT_EN = "Set up a password for your new account on {dns_domain}"
