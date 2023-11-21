from rest_framework import serializers

from plugins.polio.models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    district = serializers.SerializerMethodField(method_name="get_district")
    province = serializers.SerializerMethodField(source="get_province")
    country = serializers.SerializerMethodField(source="get_country")

    def get_district(self, obj):
        try:
            return obj.org_unit.name
        except AttributeError:
            return None

    def get_province(self, obj):
        try:
            return obj.org_unit.parent.name
        except AttributeError:
            return None

    def get_country(self, obj):
        try:
            return obj.org_unit.parent.parent.name
        except AttributeError:
            return None

    class Meta:
        model = Notification
        fields = [
            "epid_number",
            "vdpv_category",
            "source",
            "vdpv_nucleotide_diff_sabin2",
            "lineage",
            "closest_match_vdpv2",
            "date_of_onset",
            "date_results_received",
            "site_name",
            "created_at",
            "updated_at",
            # Read only.
            "district",
            "province",
            "country",
            # Write only.
            "account",
            "org_unit",
            "created_by",
            "updated_by",
        ]
        extra_kwargs = {
            "account": {"write_only": True},
            "org_unit": {"write_only": True},
            "created_by": {"write_only": True},
            "updated_by": {"write_only": True},
        }
