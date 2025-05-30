import calendar

from datetime import datetime, timedelta

import django_filters

from django.db.models import Q, QuerySet
from rest_framework import permissions
from rest_framework.exceptions import ValidationError

from hat.menupermissions import models as iaso_permission
from iaso.api.serializers import OrgUnitDropdownSerializer
from iaso.models.org_unit import OrgUnit
from plugins.polio.api.polio_org_units import PolioOrgunitViewSet
from plugins.polio.models import Round


class HasPolioPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.has_perm(iaso_permission.POLIO) or request.user.is_superuser
        )


class HasPolioAdminPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.has_perm(iaso_permission.POLIO_CONFIG) or request.user.is_superuser
        )


class LqasImCountryFilter(django_filters.rest_framework.FilterSet):
    class Meta:
        model = OrgUnit
        fields = ["id"]

    month = django_filters.CharFilter(method="filter_month")

    def filter_month(self, queryset: QuerySet[OrgUnit], name: str, value: str):
        try:
            date_obj = datetime.strptime(value, "%m-%Y")
            first_day = date_obj.replace(day=1)
            last_day = date_obj.replace(day=calendar.monthrange(date_obj.year, date_obj.month)[1])
        except:
            raise ValidationError({"month": [f"Cannot convert {value} to date object"]})

        with_lqas_end_date = Q(lqas_ended_at__isnull=False, lqas_ended_at__gte=first_day, lqas_ended_at__lte=last_day)
        # When no lqas end date we use round date +10
        without_lqas_end_date = Q(
            lqas_ended_at__isnull=True,
            ended_at__gte=first_day - timedelta(days=10),
            ended_at__lte=last_day - timedelta(days=10),
        )
        countries_with_lqas = (
            Round.objects.filter(campaign__country__in=queryset)
            .filter(with_lqas_end_date | without_lqas_end_date)
            .values_list("campaign__country__id")
        )

        return queryset.filter(id__in=countries_with_lqas).distinct("id")


class LqasImCountriesViewset(PolioOrgunitViewSet):
    http_method_names = ["get"]
    permission_classes = [HasPolioPermission | HasPolioAdminPermission]
    filterset_class = LqasImCountryFilter
    remove_results_key_if_paginated = False
    results_key = "results"

    # We need to override this method to override the serializer defined by the pareht viewset
    def get_serializer_class(self):
        return OrgUnitDropdownSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        queryset = queryset.filter(org_unit_type__category="COUNTRY")
        return queryset
