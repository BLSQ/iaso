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

    def validate_file(self, file):
        try:
            NotificationImport.read_excel(file)
        except ValueError as e:
            raise serializers.ValidationError(e)
        return file


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
            "get_vdpv_category_display",
            "source",
            "get_source_display",
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
            "get_vdpv_category_display": {"read_only": True},
            "get_source_display": {"read_only": True},
            "created_by": {"read_only": True},
            "updated_by": {"read_only": True},
        }

    def validate_org_unit(self, org_unit):
        if not org_unit.org_unit_type.category == "DISTRICT":
            raise serializers.ValidationError("`org_unit` must be of type `DISTRICT`.")
        return org_unit
