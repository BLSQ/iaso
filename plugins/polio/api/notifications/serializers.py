from rest_framework import serializers

from plugins.polio.models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    district = serializers.CharField(source="annotated_district", read_only=True)
    province = serializers.CharField(source="annotated_province", read_only=True)
    country = serializers.CharField(source="annotated_country", read_only=True)

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
            "district",
            "province",
            "country",
            "site_name",
            "created_at",
            "updated_at",
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
