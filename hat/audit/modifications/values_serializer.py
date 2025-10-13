from typing import Any, Union

from django.db import models
from django.forms import JSONField

from iaso.models import OrgUnit, OrgUnitType


class ValuesSerializer:
    def serialize(self, values: Union[JSONField, Any]) -> Union[JSONField, list[dict]]:
        return values


class OrgUnitValuesSerializer(ValuesSerializer):
    @staticmethod
    def map_field(field: str, value: str) -> Union[str, dict]:
        if field == "org_unit_type":
            return {"id": value, "name": OrgUnitType.objects.get(pk=value).name}
        return value

    def serialize(self, values: Union[JSONField, Any]) -> Union[JSONField, list[dict]]:
        dict = []
        for value in values:
            fields = value["fields"]
            for field in fields:
                fields[field] = self.map_field(field, fields[field])
            dict.append(
                {
                    "pk": value["pk"],
                    "model": value["model"],
                    "fields": fields,
                }
            )
        return dict


def get_values_serializer(content_object: models.Model) -> ValuesSerializer:
    if isinstance(content_object, OrgUnit):
        return OrgUnitValuesSerializer()
    return ValuesSerializer()
