import calendar

from datetime import datetime, timedelta

import django_filters

from django.db.models import Q, QuerySet
from django.utils.translation import gettext_lazy as _
from rest_framework import permissions, serializers
from rest_framework.exceptions import ValidationError

from hat.menupermissions import models as iaso_permission
from iaso.api.serializers import OrgUnitSerializer
from iaso.models.org_unit import OrgUnit
from plugins.polio.api.polio_org_units import PolioOrgunitViewSet
from plugins.polio.models import Campaign


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

    month = django_filters.CharFilter(method="filter_month", label=_("Month (with year)"))

    def filter_month(self, queryset: QuerySet[OrgUnit], name: str, value: str):
        try:
            date_obj = datetime.strptime(value, "%m-%Y")
            first_day = date_obj.replace(day=1)
            last_day = date_obj.replace(day=calendar.monthrange(date_obj.year, date_obj.month)[1])
        except:
            raise ValidationError({"month": [f"Cannot convert {value} to date object"]})
        countries_with_lqas = (
            Campaign.objects.filter(country__in=queryset)
            .filter(
                Q(Q(rounds__lqas_ended_at__gte=first_day) & Q(rounds__lqas_ended_at__lte=last_day))
                | Q(
                    Q(rounds__ended_at__gte=first_day - timedelta(days=10))  # TODO check days buffer value
                    & Q(rounds__ended_at__lte=last_day - timedelta(days=10))
                )
            )
            .values_list("country__id")
        )
        return queryset.filter(id__in=countries_with_lqas).distinct("id")


class OrgUnitDropDownSerializer(OrgUnitSerializer):
    label = serializers.SerializerMethodField()
    value = serializers.SerializerMethodField()

    class Meta:
        model = OrgUnit
        fields = [
            "label",
            "value",
        ]

    def get_label(self, obj):
        return obj.name

    def get_value(self, obj):
        return obj.id


class LqasImCountriesViewset(PolioOrgunitViewSet):
    http_method_names = ["get"]
    permission_classes = [HasPolioPermission | HasPolioAdminPermission]
    filterset_class = LqasImCountryFilter

    def get_serializer_class(self):
        return OrgUnitDropDownSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        queryset = queryset.filter(org_unit_type__category="COUNTRY")
        return queryset
