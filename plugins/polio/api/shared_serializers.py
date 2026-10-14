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

    def _cached_by_org_unit(self, instance: OrgUnit, key: str, compute):
        """Memoise per org unit for the lifetime of the request."""
        context = getattr(self, "context", None)
        if not isinstance(context, dict) or instance.pk is None:
            return compute()
        cache = context.setdefault("polio_org_unit_ancestors", {})
        cache_key = (key, instance.pk)
        if cache_key not in cache:
            cache[cache_key] = compute()
        return cache[cache_key]

    def get_country_parent(self, instance: OrgUnit):
        def compute():
            countries = instance.country_ancestors()
            if countries is not None and len(countries) > 0:
                country = countries[0]
                return OrgUnitSerializer(instance=country, hidden_fields=["country_parent", "root"]).data
            return None

        return self._cached_by_org_unit(instance, "country_parent", compute)

    def get_root(self, instance: OrgUnit):
        def compute():
            root = instance.root()
            return OrgUnitSerializer(instance=root, hidden_fields=["country_parent", "root"]).data if root else None

        return self._cached_by_org_unit(instance, "root", compute)

    class Meta:
        model = OrgUnit
        fields = ["id", "name", "root", "country_parent"]
