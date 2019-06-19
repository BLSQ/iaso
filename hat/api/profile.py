from copy import copy

from django.shortcuts import get_object_or_404
from django.core.paginator import Paginator

from rest_framework import viewsets, status
from rest_framework.response import Response

from hat.audit.models import log_modification, PROFILE_API
from hat.users.models import Profile, Institution, UserType, Team, SCREENING_TYPE_CHOICES, TESTER_TYPE_CHOICES
from django.contrib.auth.models import User
from django.contrib.auth.models import Permission

from .authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication
from hat.geo.models import Province, ZS, AS
from django.db.models import Q
from hat.dashboard.utils import return_error


class ProfilesViewSet(viewsets.ViewSet):
    """
    API to manage users
    Examples:


    GET /api/users/
    GET /api/users/2/

    """

    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_required = [
        "menupermissions.x_management_users",
        "menupermissions.x_vectorcontrol",
    ]

    def list(self, request):
        order = request.GET.get("order", "id")
        limit = request.GET.get("limit", 50)
        page_offset = request.GET.get("page", 1)
        search = request.GET.get("search", None)
        limit = int(limit)
        page_offset = int(page_offset)
        institution_id = request.GET.get("institutionId", request.GET.get("institution_id", None))
        as_list = request.GET.get("as_list", False)
        team_id = request.GET.get("team_id", False)

        include_inactive = request.GET.get("include_inactive", False)

        screening_type = request.GET.get("screening_type", None)
        team_type = request.GET.get("team_type", "tester")

        queryset = Profile.objects.all()

        if not include_inactive:
            queryset = queryset.filter(user__is_active=True)

        if institution_id:
            queryset = queryset.filter(institution_id=institution_id)

        if search:
            queryset = queryset.filter(
                Q(user__username__icontains=search)
                | Q(user__first_name__icontains=search)
                | Q(user__last_name__icontains=search)
            )

        if team_id:
            queryset = queryset.filter(team_id=team_id)

        if screening_type is not None:
            if screening_type not in [x[0] for x in SCREENING_TYPE_CHOICES]:
                return Response(f"Invalid screening_type, should be {SCREENING_TYPE_CHOICES}",
                                status=status.HTTP_400_BAD_REQUEST)
            queryset = queryset.filter(screening_type=screening_type)

        if team_type != "all":
            queryset = queryset.filter(team__team_type=team_type)

        matchings = {
            "userName": "user__username",
            "firstName": "user__first_name",
            "lastName": "user__last_name",
        }
        prefix = ""
        if order.startswith("-"):
            order = order[1:]
            prefix = "-"
        qs_order = "%s%s" % (prefix, matchings.get(order, order))

        queryset = queryset.order_by(qs_order)

        if not as_list:
            paginator = Paginator(queryset, limit)

            res = {"count": paginator.count}
            if page_offset > paginator.num_pages:
                page_offset = paginator.num_pages
            page = paginator.page(page_offset)

            res["users"] = list(map(lambda x: x.as_dict(), page.object_list))
            res["has_next"] = page.has_next()
            res["has_previous"] = page.has_previous()
            res["page"] = page_offset
            res["pages"] = paginator.num_pages
            res["limit"] = limit

            return Response(res)
        else:
            return Response(
                queryset.values(
                    "id",
                    "user__username",
                    "user__first_name",
                    "user__last_name",
                    "user__id",
                )
            )

    def retrieve(self, request, pk):
        profile = get_object_or_404(Profile, id=pk)
        return Response(profile.as_dict())

    def partial_update(self, request, pk=None):
        profile = get_object_or_404(Profile, id=pk)
        user = profile.user
        original_profile = copy(profile)
        original_user = copy(user)

        user.first_name = request.data.get("firstName", "")
        user.last_name = request.data.get("lastName", "")
        user.username = request.data.get("userName", "")
        user.email = request.data.get("email", "")
        password = request.data.get("password", None)
        provinces = request.data.get("province", None)
        zones = request.data.get("ZS", [])
        areas = request.data.get("AS", [])
        permissions = request.data.get("permissions", [])
        tester_type = request.data.get("tester_type", None)
        screening_type = request.data.get("screening_type", None)
        level = request.data.get("level", None)
        if password:
            user.set_password(password)
        user.save()
        log_modification(original_user, user, PROFILE_API, request.user)
        profile.user = user

        team = request.data.get("team", None)
        institution = request.data.get("institution", None)
        user_type = request.data.get("userType", None)

        new_team = None
        if team:
            new_team = get_object_or_404(Team, id=team)
        profile.team = new_team

        new_institution = None
        if institution and institution.get("id"):
            new_institution = get_object_or_404(Institution, id=institution.get("id"))
        profile.institution = new_institution

        new_user_type = None
        if user_type:
            new_user_type = get_object_or_404(UserType, id=user_type.get("id"))
        profile.userType = new_user_type

        profile.phone = request.data.get("phone", "")
        profile.province_scope.clear()
        if provinces:
            for province in provinces:
                new_province = get_object_or_404(Province, id=province)
                profile.province_scope.add(new_province)

        profile.ZS_scope.clear()
        if zones:
            for zone in zones:
                new_zone = get_object_or_404(ZS, id=zone)
                profile.ZS_scope.add(new_zone)

        profile.AS_scope.clear()
        if areas:
            for area in areas:
                new_area = get_object_or_404(AS, id=area)
                profile.AS_scope.add(new_area)
        user.user_permissions.clear()
        if permissions:
            for permission_id in permissions:
                permission = get_object_or_404(Permission, pk=permission_id)
                user.user_permissions.add(permission)
        if tester_type:
            profile.tester_type = tester_type
        if screening_type:
            if screening_type not in [x[0] for x in SCREENING_TYPE_CHOICES]:
                return Response(f"Invalid screening_type, should be {SCREENING_TYPE_CHOICES}",
                                status=status.HTTP_400_BAD_REQUEST)
            profile.screening_type = screening_type
        if level:
            profile.level = level

        profile.password_reset = request.data.get("passwordReset", False)

        profile.save()
        log_modification(original_profile, profile, PROFILE_API, request.user)
        return Response(profile.as_dict())

    def create(self, request):
        username = request.data.get("userName")
        existing_profile = Profile.objects.filter(user__username=username).first()
        if existing_profile and existing_profile.user.is_active:
            return return_error("Nom d'utlisateur existant", 400)

        if existing_profile:
            user = existing_profile.user
            user.is_active = True
        else:
            user = User()

        user.first_name = request.data.get("firstName", "")
        user.last_name = request.data.get("lastName", "")
        user.username = username
        user.email = request.data.get("email", "")
        password = request.data.get("password", None)
        provinces = request.data.get("province", None)
        zones = request.data.get("ZS", [])
        areas = request.data.get("AS", [])
        permissions = request.data.get("permissions", [])
        if password:
            user.set_password(password)
        user.save()
        institution = request.data.get("institution", None)
        user_type = request.data.get("userType", None)
        tester_type = request.data.get("testerType", request.data.get("tester_type", None))
        screening_type = request.data.get("screening_type", None)
        team = request.data.get("team", None)

        if institution:
            institution = get_object_or_404(Institution, id=institution.get("id"))
            user.profile.institution = institution
        if team:
            new_team = get_object_or_404(Team, id=team)
            user.profile.team = new_team

        if user_type:
            new_user_type = get_object_or_404(UserType, id=user_type.get("id"))
            user.profile.userType = new_user_type

        if tester_type:
            if tester_type not in [x[0] for x in TESTER_TYPE_CHOICES]:
                return Response(f"Invalid tester_type, should be {TESTER_TYPE_CHOICES}",
                                status=status.HTTP_400_BAD_REQUEST)
            user.profile.tester_type = tester_type

        if screening_type:
            if screening_type not in [x[0] for x in SCREENING_TYPE_CHOICES]:
                return Response(f"Invalid screening_type, should be {SCREENING_TYPE_CHOICES}",
                                status=status.HTTP_400_BAD_REQUEST)
            user.profile.screening_type = screening_type

        user.profile.phone = request.data.get("phone", "")

        if provinces:
            for province in provinces:
                new_province = get_object_or_404(Province, id=province)
                user.profile.province_scope.add(new_province)

        if zones:
            for zone in zones:
                new_zone = get_object_or_404(ZS, id=zone)
                user.profile.ZS_scope.add(new_zone)

        if areas:
            for area in areas:
                new_area = get_object_or_404(AS, id=area)
                user.profile.AS_scope.add(new_area)

        if permissions:
            for permission_id in permissions:
                permission = get_object_or_404(Permission, pk=permission_id)
                user.user_permissions.add(permission)
        user.profile.save()
        log_modification(None, user, PROFILE_API, request.user)
        return Response(user.profile.as_dict())

    def delete(self, request, pk):
        profile = get_object_or_404(Profile, id=pk)
        log_modification(profile.user, None, PROFILE_API, request.user)
        profile.user.is_active = False
        profile.user.save()
        return Response("ok")
