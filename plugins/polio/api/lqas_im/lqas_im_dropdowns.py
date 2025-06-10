import calendar

from datetime import datetime, timedelta

import django_filters

from django.db.models import Q, QuerySet
from rest_framework import permissions, serializers
from rest_framework.exceptions import ValidationError

from hat.menupermissions import models as iaso_permission
from iaso.api.common import ModelViewSet
from iaso.api.serializers import OrgUnitDropdownSerializer
from iaso.models.org_unit import OrgUnit
from plugins.polio.api.polio_org_units import PolioOrgunitViewSet
from plugins.polio.models import Campaign, Round


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


class LqasImCountryOptionsFilter(django_filters.rest_framework.FilterSet):
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
        # When no lqas end date we use round date +10 as fallback option (same convention used in Openhexa pipeline)
        without_lqas_end_date = Q(
            lqas_ended_at__isnull=True,
            ended_at__gte=first_day
            - timedelta(
                days=10
            ),  # since we can't use ended_at +10 >= first_day, we compare ended_at with first_day -10
            ended_at__lte=last_day - timedelta(days=10),  # same logic as above
        )
        countries_with_lqas = (
            Round.objects.filter(campaign__country__in=queryset)
            .filter(with_lqas_end_date | without_lqas_end_date)
            .values_list("campaign__country__id")
        )

        return queryset.filter(id__in=countries_with_lqas).distinct("id")


class LqasImCountriesOptionsViewset(PolioOrgunitViewSet):
    http_method_names = ["get"]
    permission_classes = [HasPolioPermission | HasPolioAdminPermission]
    filterset_class = LqasImCountryOptionsFilter
    remove_results_key_if_paginated = False
    results_key = "results"

    # We need to override this method to override the serializer defined by the parent viewset
    def get_serializer_class(self):
        return OrgUnitDropdownSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        queryset = queryset.filter(org_unit_type__category="COUNTRY")
        return queryset


class LqasImCampaignOptionsFilter(django_filters.rest_framework.FilterSet):
    class Meta:
        model = Campaign
        fields = ["id"]

    country_id = django_filters.NumberFilter(field_name="country", label="Country")

    month = django_filters.CharFilter(method="filter_month")

    def filter_month(self, queryset: QuerySet[OrgUnit], name: str, value: str):
        try:
            date_obj = datetime.strptime(value, "%m-%Y")
            first_day = date_obj.replace(day=1)
            last_day = date_obj.replace(day=calendar.monthrange(date_obj.year, date_obj.month)[1])
        except:
            raise ValidationError({"month": [f"Cannot convert {value} to date object"]})

        with_lqas_end_date = Q(lqas_ended_at__isnull=False, lqas_ended_at__gte=first_day, lqas_ended_at__lte=last_day)
        # When no lqas end date we use round date +10 as fallback (same convention as OpenHexa pipeline)
        without_lqas_end_date = Q(
            lqas_ended_at__isnull=True,
            ended_at__gte=first_day
            - timedelta(
                days=10
            ),  # since we can't use ended_at +10 >= first_day, we compare ended_at with first_day -10
            ended_at__lte=last_day - timedelta(days=10),  # same logic a s above
        )

        rounds_with_lqas = Round.objects.filter(with_lqas_end_date | without_lqas_end_date)

        return queryset.filter(rounds__in=rounds_with_lqas)


class CampaignDropDownSerializer(serializers.ModelSerializer):
    label = serializers.CharField(source="obr_name")
    value = serializers.CharField(source="id")

    class Meta:
        model = Campaign
        fields = ["value", "label"]


class LqasImCampaignOptionsViewset(ModelViewSet):
    http_method_names = ["get"]
    permission_classes = [HasPolioPermission | HasPolioAdminPermission]
    filterset_class = LqasImCampaignOptionsFilter
    remove_results_key_if_paginated = False
    results_key = "results"
    serializer_class = CampaignDropDownSerializer

    def get_queryset(self):
        user = self.request.user
        campaigns = Campaign.objects.filter_for_user(user)
        return campaigns


class RoundDropDownSerializer(serializers.ModelSerializer):
    label = serializers.SerializerMethodField(read_only=True)
    value = serializers.CharField(source="number")

    class Meta:
        model = Round
        fields = ["value", "label"]

    def get_label(self, obj):
        return f"Round {obj.number}"


class LqasImRoundOptionsFilter(django_filters.rest_framework.FilterSet):
    class Meta:
        model = Round
        fields = ["id"]

    month = django_filters.CharFilter(method="filter_month")
    campaign_id = django_filters.CharFilter(field_name="campaign", label="Campaign")

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
        return queryset.filter(with_lqas_end_date | without_lqas_end_date)


class LqasImRoundOptionsViewset(ModelViewSet):
    http_method_names = ["get"]
    permission_classes = [HasPolioPermission | HasPolioAdminPermission]
    filterset_class = LqasImRoundOptionsFilter
    remove_results_key_if_paginated = False
    results_key = "results"
    serializer_class = RoundDropDownSerializer

    def get_queryset(self):
        user = self.request.user
        return Round.objects.filter_for_user(user)
