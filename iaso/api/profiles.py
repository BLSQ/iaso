from django.core.exceptions import PermissionDenied

from rest_framework import viewsets
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.core.paginator import Paginator
from django.db.models import Q

from iaso.models import Profile

from .auth.authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication
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

    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_classes = []

    def list(self, request):
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

    def retrieve(self, request, *args, **kwargs):
        pk = kwargs.get('pk')
        if pk == 'me':
            profile = get_object_or_404(Profile, user__id=request.user.id)
        else:
            profile = get_object_or_404(Profile, pk=pk)
        return Response(profile.as_dict())

    def partial_update(self, request, pk=None):
        profile = get_object_or_404(Profile, id=pk)
        user = profile.user
        user.first_name = request.data.get("first_name", "")
        user.last_name = request.data.get("last_name", "")
        user.username = request.data.get("user_name", "")
        user.email = request.data.get("email", "")
        permissions = request.data.get("permissions", [])
        user.user_permissions.clear()
        for permission_codename in permissions:
            permission = get_object_or_404(Permission, codename=permission_codename)
            user.user_permissions.add(permission)
        user.save()

        return Response(profile.as_dict())

    def create(self, request):
        username = request.data.get("user_name")
        if not username:
            return return_error("Nom d'utilisateur requis", 400)
        existing_profile = Profile.objects.filter(user__username=username).first()
        if existing_profile:
            return return_error("Nom d'utilisateur existant", 400)

        user = User()
        user.first_name = request.data.get("first_name", "")
        user.last_name = request.data.get("last_name", "")
        user.username = username
        user.email = request.data.get("email", "")
        permissions = request.data.get("permissions", [])
        for permission_codename in permissions:
            permission = get_object_or_404(Permission, codename=permission_codename)
            user.user_permissions.add(permission)
        user.save()
        return Response(user.profile.as_dict())
