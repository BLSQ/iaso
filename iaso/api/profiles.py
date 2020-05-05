from django.core.exceptions import PermissionDenied

from rest_framework import viewsets
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.core.paginator import Paginator
from django.db.models import Q
from django.http import JsonResponse

from iaso.models import Profile, Account, OrgUnit

from django.contrib.auth.models import Permission
from django.contrib.auth.models import User
from hat.dashboard.utils import return_error


class ProfilesViewSet(viewsets.ViewSet):
    """
    API to list profiles or get profile detail
    Examples:


    GET /api/profiles/
    GET /api/profiles/pk
    GET /api/profiles/me => current user

    """

    permission_classes = []

    def list(self, request):
        if request.user.has_perm("menupermissions.iaso_users") or request.user.has_perm("menupermissions.iaso_links") or request.user.is_superuser:
            limit = request.GET.get("limit", None)
            page_offset = request.GET.get("page", 1)
            orders = request.GET.get("order", "user__user_name").split(",")
            search = request.GET.get("search", None)

            if request.user.is_anonymous:
                raise PermissionDenied("Please log in")

            account = request.user.iaso_profile.account
            queryset = Profile.objects.filter(account=account)
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
        else:
            return Response("Unauthorized", status=401)

    def retrieve(self, request, *args, **kwargs):
        pk = kwargs.get("pk")
        if pk == "me":
            profile = get_object_or_404(Profile, user__id=request.user.id)
            return Response(profile.as_dict())
        else:
            if request.user.has_perm("menupermissions.iaso_users") or request.user.is_superuser:
                profile = get_object_or_404(Profile, pk=pk)
                return Response(profile.as_dict())
            else:
                return Response("Unauthorized", status=401)

    def partial_update(self, request, pk=None):
        if request.user.has_perm("menupermissions.iaso_users") or request.user.is_superuser:
            profile = get_object_or_404(Profile, id=pk)
            username = request.data.get("user_name")
            password = request.data.get("password", "")
            if not username:
                return JsonResponse({"errorKey": "user_name", "errorMessage": "Nom d'utilisateur requis"}, status=400)
            user = profile.user
            user.first_name = request.data.get("first_name", "")
            user.last_name = request.data.get("last_name", "")
            user.username = username
            user.email = request.data.get("email", "")
            if password != "":
                user.set_password(password)
            permissions = request.data.get("permissions", [])
            user.user_permissions.clear()
            for permission_codename in permissions:
                permission = get_object_or_404(Permission, codename=permission_codename)
                user.user_permissions.add(permission)
            user.save()
            org_units = request.data.get("org_units", [])
            profile.org_units.clear()
            for org_unit in org_units:
                org_unit_item = get_object_or_404(OrgUnit, pk=org_unit.get("id"))
                profile.org_units.add(org_unit_item)
            profile.save()
            return Response(profile.as_dict())
        else:
            return Response("Unauthorized", status=401)

    def create(self, request):
        if request.user.has_perm("menupermissions.iaso_users") or request.user.is_superuser:
            username = request.data.get("user_name")
            password = request.data.get("password", "")
            if not username:
                return JsonResponse({"errorKey": "user_name", "errorMessage": "Nom d'utilisateur requis"}, status=400)
            if not password:
                return JsonResponse({"errorKey": "password", "errorMessage": "Mot de passe requis"}, status=400)
            existing_profile = User.objects.filter(username=username).first()
            if existing_profile:
                return JsonResponse({"errorKey": "user_name", "errorMessage": "Nom d'utilisateur existant"}, status=400)

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
            current_profile_id = request.user.id
            current_user_profile = get_object_or_404(Profile, id=current_profile_id)
            account = get_object_or_404(Account, id=current_user_profile.account.id)
            profile = Profile()
            profile.account = account
            profile.user = user
            profile.save()

            return Response(user.profile.as_dict())
        else:
            return Response("Unauthorized", status=401)

    def delete(self, request, pk=None):
        profile = get_object_or_404(Profile, id=pk)
        user = profile.user
        user.delete()
        profile.delete()
        return Response(True)
