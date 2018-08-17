from django.shortcuts import get_object_or_404
from django.core.paginator import Paginator

from rest_framework import viewsets
from rest_framework.response import Response

from hat.users.models import Profile, Institution
from django.contrib.auth.models import User

from .authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication
from hat.geo.models import Province, ZS, AS


class ProfilesViewSet(viewsets.ViewSet):
    """
    API to manage users
    Examples:


    GET /api/users/
    GET /api/users/2/

    """
    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)

    def list(self, request):
        order = request.GET.get("order", 'id')
        limit = request.GET.get("limit", 50)
        page_offset = request.GET.get("page", 1)
        limit = int(limit)
        page_offset = int(page_offset)

        queryset = Profile.objects.all()

        queryset = queryset.order_by(order)

        paginator = Paginator(queryset, limit)

        res = {"count": paginator.count}
        if page_offset > paginator.num_pages:
            page_offset = paginator.num_pages
        page = paginator.page(page_offset)

        res["users"] = map(lambda x: x.as_dict(), page.object_list)
        res["has_next"] = page.has_next()
        res["has_previous"] = page.has_previous()
        res["page"] = page_offset
        res["pages"] = paginator.num_pages
        res["limit"] = limit

        return Response(res)


    def retrieve(self, request, pk):
        profile = get_object_or_404(Profile, id=pk)
        return Response(profile.as_dict())


    def update(self, request, pk=None):
        profile = get_object_or_404(Profile, id=pk)
        user = profile.user
        user.first_name = request.data.get('firstName', '')
        user.last_name = request.data.get('lastName', '')
        user.username = request.data.get('userName', '')
        user.email = request.data.get('email', '')
        password = request.data.get('password', None)
        provinces = request.data.get('province', None)
        zones = request.data.get('zone', None)
        areas = request.data.get('area', None)
        if password:
            user.set_password(password)
        user.save()
        profile.user = user
        institutionId = request.data.get('institutionId', None)

        if institutionId:
            institution = get_object_or_404(Institution, id=institutionId)
            profile.institution = institution

        profile.phone = request.data.get('phone', '')
        if provinces:
            profile.province_scope.clear()
            for province in provinces.split(','):
                new_province = get_object_or_404(Province, id=province)
                profile.province_scope.add(new_province)

        if zones:
            profile.ZS_scope.clear()
            for zone in zones.split(','):
                new_zone = get_object_or_404(ZS, id=zone)
                profile.ZS_scope.add(new_zone)

        if areas:
            profile.AS_scope.clear()
            for area in areas.split(','):
                new_area = get_object_or_404(AS, id=area)
                profile.AS_scope.add(new_area)
        profile.save()
        return Response(profile.as_dict())

    def create(self, request):
        user = User()
        user.first_name = request.data.get('firstName', '')
        user.last_name = request.data.get('lastName', '')
        user.username = request.data.get('userName', '')
        user.email = request.data.get('email', '')
        password = request.data.get('password', None)
        if password:
            user.set_password(password)
        user.save()
        #ici, faire les modifications au profile
        institutionId = request.data.get('institutionId', None)
        if institutionId:
            institution = get_object_or_404(Institution, id=institutionId)
            user.profile.institution = institution
        user.profile.phone = request.data.get('phone', '')
        user.profile.save()
        return Response(user.profile.as_dict())

    def delete(self, request, pk):
        profile = get_object_or_404(Profile, id=pk)
        profile.delete()
        return Response("ok")

