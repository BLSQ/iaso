"""
FHIR Location serializers for OrgUnits

Provides DRF serializers that convert Iaso OrgUnit objects
to FHIR R4 compliant Location resources.
"""

from typing import Any, Dict, List

from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from iaso.api.fhir.constants import (
    DEFAULT_PHYSICAL_TYPE,
    FHIR_STATUS_CHOICES,
    PHYSICAL_TYPE_MAPPING,
    REVERSE_STATUS_MAPPING,
)
from iaso.models import OrgUnit


class FHIRLocationSerializer(serializers.ModelSerializer):
    """
    Serializer that converts OrgUnit to FHIR Location resource
    """

    # FHIR Location fields
    resourceType = serializers.SerializerMethodField()
    id = serializers.SerializerMethodField()
    meta = serializers.SerializerMethodField()
    identifier = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    name = serializers.CharField()
    mode = serializers.SerializerMethodField()
    type = serializers.SerializerMethodField()
    physicalType = serializers.SerializerMethodField()
    position = serializers.SerializerMethodField()
    partOf = serializers.SerializerMethodField()
    managingOrganization = serializers.SerializerMethodField()
    operationalStatus = serializers.SerializerMethodField()
    extension = serializers.SerializerMethodField()

    class Meta:
        model = OrgUnit
        fields = [
            "resourceType",
            "id",
            "meta",
            "identifier",
            "status",
            "name",
            "mode",
            "type",
            "physicalType",
            "position",
            "partOf",
            "managingOrganization",
            "operationalStatus",
            "extension",
        ]

    @extend_schema_field(serializers.ChoiceField(choices=["Location"]))
    def get_resourceType(self, obj: OrgUnit) -> str:
        return "Location"

    @extend_schema_field(serializers.CharField())
    def get_id(self, obj: OrgUnit) -> str:
        return str(obj.id)

    @extend_schema_field(serializers.DictField())
    def get_meta(self, obj: OrgUnit) -> Dict[str, Any]:
        meta = {"versionId": "1", "profile": ["https://hl7.org/fhir/StructureDefinition/Location"]}
        if obj.updated_at:
            meta["lastUpdated"] = obj.updated_at.isoformat()
        return meta

    @extend_schema_field(serializers.ListField(child=serializers.DictField()))
    def get_identifier(self, obj: OrgUnit) -> List[Dict[str, Any]]:
        identifiers = []

        # Source reference identifier
        if obj.source_ref:
            data_source_name = obj.version.data_source.name if obj.version and obj.version.data_source else "unknown"
            identifiers.append(
                {
                    "use": "official",
                    "system": f"https://openiaso.com/org-unit/{data_source_name}/source-ref",
                    "value": obj.source_ref,
                }
            )

        # UUID identifier
        if obj.uuid:
            identifiers.append({"use": "secondary", "system": "https://openiaso.com/org-unit/uuid", "value": obj.uuid})

        # Alias identifiers
        if obj.aliases:
            for alias in obj.aliases:
                identifiers.append(
                    {"use": "secondary", "system": "https://openiaso.com/org-unit/alias", "value": alias}
                )

        return identifiers

    @extend_schema_field(serializers.ChoiceField(choices=FHIR_STATUS_CHOICES, default="active"))
    def get_status(self, obj: OrgUnit) -> str:
        """Map OrgUnit validation status to FHIR Location status"""
        return REVERSE_STATUS_MAPPING.get(obj.validation_status, "active")

    @extend_schema_field(serializers.ChoiceField(choices=["instance"]))
    def get_mode(self, obj: OrgUnit) -> str:
        return "instance"

    @extend_schema_field(serializers.ListField(child=serializers.DictField()))
    def get_type(self, obj: OrgUnit) -> List[Dict[str, Any]]:
        if not obj.org_unit_type:
            return []

        return [
            {
                "coding": [
                    {
                        "system": "https://openiaso.com/org-unit-type",
                        "code": obj.org_unit_type.short_name,
                        "display": obj.org_unit_type.name,
                    }
                ],
                "text": obj.org_unit_type.name,
            }
        ]

    @extend_schema_field(serializers.DictField())
    def get_physicalType(self, obj: OrgUnit) -> Dict[str, Any]:
        if not obj.org_unit_type or not obj.org_unit_type.category:
            return {}
        code = PHYSICAL_TYPE_MAPPING.get(obj.org_unit_type.category, DEFAULT_PHYSICAL_TYPE)
        return {"coding": [{"system": "https://terminology.hl7.org/CodeSystem/location-physical-type", "code": code}]}

    @extend_schema_field(serializers.DictField(child=serializers.FloatField()))
    def get_position(self, obj: OrgUnit) -> Dict[str, float]:
        if not obj.location:
            return {}

        position = {"longitude": float(obj.location.x), "latitude": float(obj.location.y)}

        if obj.location.z is not None:
            position["altitude"] = float(obj.location.z)

        return position

    @extend_schema_field(serializers.DictField(child=serializers.CharField()))
    def get_partOf(self, obj: OrgUnit) -> Dict[str, str]:
        if not obj.parent:
            return {}

        return {"reference": f"Location/{obj.parent.id}", "display": obj.parent.name}

    @extend_schema_field(serializers.DictField(child=serializers.CharField()))
    def get_managingOrganization(self, obj: OrgUnit) -> Dict[str, str]:
        if not obj.version or not obj.version.data_source:
            return {}

        return {"display": obj.version.data_source.name}

    @extend_schema_field(serializers.DictField())
    def get_operationalStatus(self, obj: OrgUnit) -> Dict[str, Any]:
        # Determine operational status based on dates
        if obj.closed_date:
            return {
                "coding": [
                    {"system": "https://terminology.hl7.org/CodeSystem/v2-0116", "code": "C", "display": "Closed"}
                ]
            }
        if obj.opening_date:
            return {
                "coding": [{"system": "https://terminology.hl7.org/CodeSystem/v2-0116", "code": "O", "display": "Open"}]
            }
        return {}

    @extend_schema_field(serializers.ListField(child=serializers.DictField()))
    def get_extension(self, obj: OrgUnit) -> List[Dict[str, Any]]:
        extensions = []

        # Validation status extension
        extensions.append(
            {
                "url": "https://openiaso.com/fhir/StructureDefinition/org-unit-validation-status",
                "valueCode": obj.validation_status,
            }
        )

        # Org unit type depth
        if obj.org_unit_type and obj.org_unit_type.depth is not None:
            extensions.append(
                {
                    "url": "https://openiaso.com/fhir/StructureDefinition/org-unit-type-depth",
                    "valueInteger": obj.org_unit_type.depth,
                }
            )

        # Source version
        if obj.version:
            extensions.append(
                {
                    "url": "https://openiaso.com/fhir/StructureDefinition/source-version",
                    "valueString": str(obj.version.number),
                }
            )

        # Opening date
        if obj.opening_date:
            extensions.append(
                {
                    "url": "https://openiaso.com/fhir/StructureDefinition/opening-date",
                    "valueDate": obj.opening_date.isoformat(),
                }
            )

        # Closing date
        if obj.closed_date:
            extensions.append(
                {
                    "url": "https://openiaso.com/fhir/StructureDefinition/closed-date",
                    "valueDate": obj.closed_date.isoformat(),
                }
            )

        return extensions
