import calendar

from datetime import datetime, timedelta

import django_filters

from django.db.models import DateField, F, QuerySet, Window
from django.db.models.functions import Coalesce, RowNumber
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from iaso.api.common import ModelViewSet
from iaso.models.base import Group
from plugins.polio.api.lqas_im.permissions import HasPolioAdminPermission, HasPolioPermission
from plugins.polio.models.lqas_im import LqasCareGiverStats, LqasEntry


class LqasCountryBlockFilter(django_filters.rest_framework.FilterSet):
    class Meta:
        model = LqasEntry
        fields = "__all__"

    country_block_id = django_filters.NumberFilter(method="filter_country_block")

    month = django_filters.CharFilter(method="filter_month")

    def filter_country_block(self, queryset: QuerySet[LqasEntry], name: str, value: int):
        try:
            country_block = Group.objects.get(id=value)
            return queryset.filter(round__campaign__country__in=country_block.org_units.all())
        except Group.DoesNotExist as e:
            raise ValidationError(f"Group with id {value} not found")

    def filter_month(self, queryset: QuerySet[LqasEntry], name: str, value: str):
        try:
            date_obj = datetime.strptime(value, "%m-%Y")
            first_day = date_obj.replace(day=1)
            last_day = date_obj.replace(day=calendar.monthrange(date_obj.year, date_obj.month)[1])
        except:
            raise ValidationError({"month": [f"Cannot convert {value} to date object"]})

        queryset = (
            queryset.annotate(
                # Create unified date field for comparison
                effective_date=Coalesce(
                    "subactivity__lqas_ended_at",
                    F("subactivity__end_date") + timedelta(days=10),
                    "round__lqas_ended_at",
                    F("round__ended_at") + timedelta(days=10),
                    output_field=DateField(),
                ),
                # Rank entries by recency within each district
                recency_rank=Window(
                    expression=RowNumber(),
                    partition_by=F("district"),
                    order_by=[
                        F("effective_date").desc(nulls_last=True),
                        F("round__number").desc(nulls_last=True),
                    ],
                ),
            ).filter(
                recency_rank=1,
                effective_date__gte=first_day,
                effective_date__lte=last_day,
            )  # Keep only the most recent entry per district for which the effective date is in range
        )

        return queryset


class LqasCareGiverStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model = LqasCareGiverStats
        fields = "__all__"


class LqasCountryBlockSerializer(serializers.ModelSerializer):
    caregiver_stats = LqasCareGiverStatsSerializer()
    district_id = serializers.SlugRelatedField(source="district", slug_field="id", read_only=True)
    district_name = serializers.CharField(read_only=True, source="district.name")
    region_id = serializers.SlugRelatedField(source="district.parent", slug_field="id", read_only=True)
    region_name = serializers.CharField(read_only=True, source="district.parent.name")
    round_id = serializers.SlugRelatedField(source="round", slug_field="id", read_only=True)
    round_number = serializers.IntegerField(read_only=True, source="round.number")
    obr_name = serializers.CharField(read_only=True, source="round.campaign.name")

    class Meta:
        model = LqasEntry
        fields = "__all__"


class LqasCountryBlockViewset(ModelViewSet):
    http_method_names = ["get"]
    model = LqasEntry
    permission_classes = [HasPolioPermission | HasPolioAdminPermission]
    filterset_class = LqasCountryBlockFilter
    remove_results_key_if_paginated = False
    results_key = "results"
    serializer_class = LqasCountryBlockSerializer

    def get_queryset(self):
        user = self.request.user
        return (
            LqasEntry.objects.filter_for_user(user)
            .select_related(
                "district", "district__parent", "round", "round__campaign", "round__campaign__country", "subactivity"
            )
            .prefetch_related(
                "caregiver_stats",
            )
        )
