from rest_framework import serializers

from plugins.polio.models import Notification, NotificationImport


class NotificationImportSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationImport
        fields = ["id", "account", "file", "created_by"]
        extra_kwargs = {
            "id": {"read_only": True},
            "account": {"read_only": True},
        }


class NotificationSerializer(serializers.ModelSerializer):
    district = serializers.CharField(source="annotated_district", read_only=True)
    province = serializers.CharField(source="annotated_province", read_only=True)
    country = serializers.CharField(source="annotated_country", read_only=True)

    class Meta:
        model = Notification
        fields = [
            "id",
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
            "org_unit",
            "account",
            "created_by",
            "created_at",
            "updated_by",
            "updated_at",
        ]
        extra_kwargs = {
            "id": {"read_only": True},
            "account": {"read_only": True},
            "created_by": {"read_only": True},
            "updated_by": {"read_only": True},
        }
