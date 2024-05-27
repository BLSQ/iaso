from typing import Union

from django.db.models import Count
from rest_framework import serializers

from iaso.api.common import DynamicFieldsModelSerializer
from iaso.models import OrgUnit


class OrgUnitTreeSerializer(DynamicFieldsModelSerializer, serializers.ModelSerializer):
    has_children = serializers.SerializerMethodField()
    org_unit_type_short_name = serializers.SerializerMethodField()
    parent = serializers.SerializerMethodField()

    @classmethod
    def get_has_children(cls, org_unit: OrgUnit) -> bool:
        return org_unit.children_count > 0

    def get_org_unit_type_short_name(self, org_unit: OrgUnit) -> Union[str, None]:
        return org_unit.org_unit_type.short_name if org_unit.org_unit_type else None

    def get_parent(self, org_unit: OrgUnit):
        if org_unit.parent:
            parent_with_annotation = (
                OrgUnit.objects.filter(pk=org_unit.parent.pk).annotate(children_count=Count("orgunit")).first()
            )
            return OrgUnitTreeSerializer(parent_with_annotation, context=self.context).data
        return None

    class Meta:
        model = OrgUnit
        fields = [
            "id",
            "name",
            "validation_status",
            "has_children",
            "org_unit_type_id",
            "org_unit_type_short_name",
            "parent",
        ]
        default_fields = [
            "id",
            "name",
            "validation_status",
            "has_children",
            "org_unit_type_id",
            "org_unit_type_short_name",
            "parent",
        ]
