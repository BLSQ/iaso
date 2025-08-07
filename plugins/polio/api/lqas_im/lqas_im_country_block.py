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
            return queryset.prefetch_related("round__campaign__country").filter(
                round__campaign__country__in=country_block.org_units.all()
            )
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
        fields = ["ratio", "best_info_source", "best_info_ratio", "caregivers_informed", "caregivers_informed_ratio"]


class LqasCountryBlockSerializer(serializers.ModelSerializer):
    district_id = serializers.IntegerField(source="district.id", read_only=True)
    district_name = serializers.CharField(source="district.name", read_only=True)
    region_id = serializers.IntegerField(source="district.parent.id", read_only=True)
    region_name = serializers.CharField(source="district.parent.name", read_only=True)
    round_id = serializers.IntegerField(source="round.id", read_only=True)
    round_number = serializers.IntegerField(source="round.number", read_only=True)
    obr_name = serializers.CharField(source="round.campaign.name", read_only=True)

    # Only include caregiver_stats if it exists (avoid N+1)
    caregiver_stats = serializers.SerializerMethodField()

    class Meta:
        model = LqasEntry
        fields = [
            "id",
            "total_children_fmd",
            "total_children_checked",
            "total_sites_visited",
            "status",
            "district_id",
            "district_name",
            "region_id",
            "region_name",
            "round_id",
            "round_number",
            "obr_name",
            "caregiver_stats",
        ]

    def get_caregiver_stats(self, obj):
        """Only serialize caregiver_stats if it exists to avoid N+1 queries"""
        if hasattr(obj, "caregiver_stats") and obj.caregiver_stats:
            return LqasCareGiverStatsSerializer(obj.caregiver_stats).data
        return None


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
        queryset = (
            LqasEntry.objects.filter_for_user(user)
            .select_related(
                "district", "district__parent", "round", "round__campaign", "subactivity", "round__campaign__country"
            )
            .only(
                # Core LqasEntry fields
                "id",
                "total_children_fmd",
                "total_children_checked",
                "total_sites_visited",
                "status",
                "district_id",
                "district__name",
                "district__parent_id",
                "district__parent__name",
                # Round fields
                "round_id",
                "round__number",
                # Campaign fields
                "round__campaign_id",
                "round__campaign__obr_name",
                # Subactivity fields
                "subactivity_id",
                "subactivity__name",
                "round__campaign__country_id",
                "round__campaign__country__name",
            )
            .prefetch_related(
                "caregiver_stats",
            )
        )
        print(str(queryset.query))
        return queryset
