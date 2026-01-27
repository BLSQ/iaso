from rest_framework import serializers

from iaso.models import Group
from plugins.polio.preparedness.spreadsheet_manager import *


logger = getLogger(__name__)


class GroupSerializer(serializers.ModelSerializer):
    org_units = serializers.PrimaryKeyRelatedField(
        many=True, allow_empty=True, queryset=OrgUnit.objects.all(), style={"base_template": "input.html"}
    )
    name = serializers.CharField(default="hidden")

    class Meta:
        model = Group
        fields = ["name", "org_units", "id"]
        ref_name = "polio_group_serializer"


class OrgUnitSerializer(serializers.ModelSerializer):
    country_parent = serializers.SerializerMethodField()
    root = serializers.SerializerMethodField()  # type: ignore

    def __init__(self, *args, **kwargs):
        for field in kwargs.pop("hidden_fields", []):
            self.fields.pop(field)
        super().__init__(*args, **kwargs)

    def get_country_parent(self, instance: OrgUnit):
        countries = instance.country_ancestors()
        if countries is not None and len(countries) > 0:
            country = countries[0]
            return OrgUnitSerializer(instance=country, hidden_fields=["country_parent", "root"]).data

    def get_root(self, instance: OrgUnit):
        root = instance.root()
        return OrgUnitSerializer(instance=root, hidden_fields=["country_parent", "root"]).data if root else None

    class Meta:
        model = OrgUnit
        fields = ["id", "name", "root", "country_parent"]
