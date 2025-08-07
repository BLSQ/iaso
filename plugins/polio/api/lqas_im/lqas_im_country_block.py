import calendar

from datetime import datetime, timedelta

import django_filters

from django.db.models import DateField, Exists, F, OuterRef, Q, QuerySet
from django.db.models.functions import Coalesce
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
            queryset.filter(
                Q(
                    subactivity__isnull=True,
                    round__lqas_ended_at__isnull=False,
                    round__lqas_ended_at__gte=first_day,
                    round__lqas_ended_at__lte=last_day,
                )
                | Q(
                    subactivity__isnull=True,
                    round__lqas_ended_at__isnull=True,
                    round__ended_at__gte=first_day - timedelta(days=10),
                    round__ended_at__lte=last_day - timedelta(days=10),
                )
                | Q(
                    subactivity__isnull=False,
                    subactivity__lqas_ended_at__isnull=False,
                    subactivity__lqas_ended_at__gte=first_day,
                    subactivity__lqas_ended_at__lte=last_day,
                )
                | Q(
                    subactivity__isnull=False,
                    subactivity__lqas_ended_at__isnull=True,
                    subactivity__end_date__gte=first_day - timedelta(days=10),
                    subactivity__end_date__lte=last_day - timedelta(days=10),
                )
            )
            .annotate(
                # Pre-annotate the date fields to simplify Coalesce
                subactivity_lqas_date=F("subactivity__lqas_ended_at"),
                subactivity_end_date_plus_10=F("subactivity__end_date") + timedelta(days=10),
                round_lqas_date=F("round__lqas_ended_at"),
                round_end_date_plus_10=F("round__ended_at") + timedelta(days=10),
            )
            .annotate(
                ranking_date=Coalesce(
                    "subactivity_lqas_date",
                    "subactivity_end_date_plus_10",
                    "round_lqas_date",
                    "round_end_date_plus_10",
                    output_field=DateField(),
                ),
            ),
        )
        #         recency_rank=Window(
        #             expression=RowNumber(),
        #             partition_by=F("district"),
        #             order_by=[
        #                 F("ranking_date").desc(nulls_last=True),  # Most recent date first
        #                 F("round__number").desc(nulls_last=True),  # Tie-breaker
        #             ],
        #         ),
        #     )
        #     .filter(recency_rank=1)
        # )
        # return queryset

        # Use EXISTS to find the most recent entry per district
        # This replaces the Window function with a more efficient subquery
        return queryset.filter(
            ~Exists(LqasEntry.objects.filter(district=OuterRef("district"), ranking_date__gt=OuterRef("ranking_date")))
        )


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
