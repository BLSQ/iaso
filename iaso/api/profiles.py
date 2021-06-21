from django.contrib.auth import update_session_auth_hash

from rest_framework import viewsets, permissions
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.core.paginator import Paginator
from django.db.models import Q
from django.http import JsonResponse
from django.utils.translation import gettext as _


from iaso.models import Profile, OrgUnit

from django.contrib.auth.models import Permission
from django.contrib.auth.models import User


class HasProfilePermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if view.action == "retrieve" and view.kwargs.get("pk") == "me":
            return True
        if (not request.user.has_perm("menupermissions.iaso_users")) and request.method != "GET":
            return False
        return True


class ProfilesViewSet(viewsets.ViewSet):
    """Profiles API

    This API is restricted to authenticated users having the "menupermissions.iaso_users" permission, with one
    exception: GET /api/profiles/me is accessible to any authenticated user.

    GET /api/profiles/
    GET /api/profiles/me => current user
    GET /api/profiles/<id>
    POST /api/profiles/
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
        orders = request.GET.get("order", "user__user_name").split(",")
        search = request.GET.get("search", None)

        queryset = self.get_queryset()
        if search:
            queryset = queryset.filter(
                Q(user__username__icontains=search)
                | Q(user__first_name__icontains=search)
                | Q(user__last_name__icontains=search)
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
        if pk == "me":
            profile = get_object_or_404(self.get_queryset(), user__id=request.user.id)
            return Response(profile.as_dict())
        else:
            profile = get_object_or_404(self.get_queryset(), pk=pk)
            return Response(profile.as_dict())

    def partial_update(self, request, pk=None):
        profile = get_object_or_404(self.get_queryset(), id=pk)
        username = request.data.get("user_name")
        password = request.data.get("password", "")
        if not username:
            return JsonResponse({"errorKey": "user_name", "errorMessage": "Nom d'utilisateur requis"}, status=400)
        user = profile.user
        user.first_name = request.data.get("first_name", "")
        user.last_name = request.data.get("last_name", "")
        user.username = username
        user.email = request.data.get("email", "")
        profile.language = request.data.get("language", "")
        if password != "":
            user.set_password(password)
        permissions = request.data.get("permissions", [])
        user.user_permissions.clear()
        for permission_codename in permissions:
            permission = get_object_or_404(Permission, codename=permission_codename)
            user.user_permissions.add(permission)
        user.save()

        if password and request.user == user:
            # update session hash if you changed your own password so you don't get unlogged
            # https://docs.djangoproject.com/en/3.2/topics/auth/default/#session-invalidation-on-password-change
            update_session_auth_hash(request, user)

        org_units = request.data.get("org_units", [])
        profile.org_units.clear()
        for org_unit in org_units:
            org_unit_item = get_object_or_404(OrgUnit, pk=org_unit.get("id"))
            profile.org_units.add(org_unit_item)
        profile.save()
        return Response(profile.as_dict())

    def create(self, request):
        username = request.data.get("user_name")
        password = request.data.get("password", "")
        if not username:
            return JsonResponse({"errorKey": "user_name", "errorMessage": _("Nom d'utilisateur requis")}, status=400)
        if not password:
            return JsonResponse({"errorKey": "password", "errorMessage": _("Mot de passe requis")}, status=400)
        existing_profile = User.objects.filter(username=username).first()
        if existing_profile:
            return JsonResponse({"errorKey": "user_name", "errorMessage": _("Nom d'utilisateur existant")}, status=400)

        user = User()
        user.first_name = request.data.get("first_name", "")
        user.last_name = request.data.get("last_name", "")
        user.username = username
        user.email = request.data.get("email", "")
        permissions = request.data.get("permissions", [])
        if password != "":
            user.set_password(password)
        user.save()
        for permission_codename in permissions:
            permission = get_object_or_404(Permission, codename=permission_codename)
            user.user_permissions.add(permission)
        if permissions != []:
            user.save()

        # Create a iaso profile for the new user and attach it to the same account
        # as the currently authenticated user
        current_profile = request.user.iaso_profile
        user.profile = Profile.objects.create(user=user, account=current_profile.account)
        user.profile.language = request.data.get("language", "")

        org_units = request.data.get("org_units", [])
        profile = get_object_or_404(Profile, id=user.profile.pk)
        profile.org_units.clear()
        for org_unit in org_units:
            org_unit_item = get_object_or_404(OrgUnit, pk=org_unit.get("id"))
            profile.org_units.add(org_unit_item)
        profile.save()
        return Response(user.profile.as_dict())

    def delete(self, request, pk=None):
        profile = get_object_or_404(self.get_queryset(), id=pk)
        user = profile.user
        user.delete()
        profile.delete()
        return Response(True)
