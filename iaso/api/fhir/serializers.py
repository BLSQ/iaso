"""
FHIR Location serializers for OrgUnits

Provides DRF serializers that convert Iaso OrgUnit objects
to FHIR R4 compliant Location resources.
"""

from typing import Any, Dict, List

from rest_framework import serializers

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

    def get_resourceType(self, obj: OrgUnit) -> str:
        return "Location"

    def get_id(self, obj: OrgUnit) -> str:
        return str(obj.id)

    def get_meta(self, obj: OrgUnit) -> Dict[str, Any]:
        meta = {"versionId": "1", "profile": ["http://hl7.org/fhir/StructureDefinition/Location"]}
        if obj.updated_at:
            meta["lastUpdated"] = obj.updated_at.isoformat()
        return meta

    def get_identifier(self, obj: OrgUnit) -> List[Dict[str, Any]]:
        identifiers = []

        # Source reference identifier
        if obj.source_ref:
            data_source_name = obj.version.data_source.name if obj.version and obj.version.data_source else "unknown"
            identifiers.append(
                {
                    "use": "official",
                    "system": f"http://iaso.org/org-unit/{data_source_name}/source-ref",
                    "value": obj.source_ref,
                }
            )

        # UUID identifier
        if obj.uuid:
            identifiers.append({"use": "secondary", "system": "http://iaso.org/org-unit/uuid", "value": obj.uuid})

        # Alias identifiers
        if obj.aliases:
            for alias in obj.aliases:
                identifiers.append({"use": "secondary", "system": "http://iaso.org/org-unit/alias", "value": alias})

        return identifiers

    def get_status(self, obj: OrgUnit) -> str:
        """Map OrgUnit validation status to FHIR Location status"""
        status_mapping = {
            OrgUnit.VALIDATION_NEW: "suspended",
            OrgUnit.VALIDATION_VALID: "active",
            OrgUnit.VALIDATION_REJECTED: "inactive",
        }
        return status_mapping.get(obj.validation_status, "active")

    def get_mode(self, obj: OrgUnit) -> str:
        return "instance"

    def get_type(self, obj: OrgUnit) -> List[Dict[str, Any]]:
        if not obj.org_unit_type:
            return []

        return [
            {
                "coding": [
                    {
                        "system": "http://iaso.org/org-unit-type",
                        "code": obj.org_unit_type.short_name,
                        "display": obj.org_unit_type.name,
                    }
                ],
                "text": obj.org_unit_type.name,
            }
        ]

    def get_physicalType(self, obj: OrgUnit) -> Dict[str, Any]:
        if not obj.org_unit_type or not obj.org_unit_type.category:
            return {}

        # Map OrgUnit type categories to FHIR physical type codes
        physical_type_mapping = {
            "COUNTRY": "co",  # Country
            "REGION": "area",  # Area
            "DISTRICT": "area",  # Area
            "HF": "bu",  # Building
        }

        code = physical_type_mapping.get(obj.org_unit_type.category, "si")
        return {"coding": [{"system": "http://terminology.hl7.org/CodeSystem/location-physical-type", "code": code}]}

    def get_position(self, obj: OrgUnit) -> Dict[str, float]:
        if not obj.location:
            return {}

        position = {"longitude": float(obj.location.x), "latitude": float(obj.location.y)}

        if obj.location.z is not None:
            position["altitude"] = float(obj.location.z)

        return position

    def get_partOf(self, obj: OrgUnit) -> Dict[str, str]:
        if not obj.parent:
            return {}

        return {"reference": f"Location/{obj.parent.id}", "display": obj.parent.name}

    def get_managingOrganization(self, obj: OrgUnit) -> Dict[str, str]:
        if not obj.version or not obj.version.data_source:
            return {}

        return {"display": obj.version.data_source.name}

    def get_operationalStatus(self, obj: OrgUnit) -> Dict[str, Any]:
        # Determine operational status based on dates
        if obj.closed_date:
            return {
                "coding": [
                    {"system": "http://terminology.hl7.org/CodeSystem/v2-0116", "code": "C", "display": "Closed"}
                ]
            }
        if obj.opening_date:
            return {
                "coding": [{"system": "http://terminology.hl7.org/CodeSystem/v2-0116", "code": "O", "display": "Open"}]
            }
        return {}

    def get_extension(self, obj: OrgUnit) -> List[Dict[str, Any]]:
        extensions = []

        # Validation status extension
        extensions.append(
            {
                "url": "http://iaso.org/fhir/StructureDefinition/org-unit-validation-status",
                "valueCode": obj.validation_status,
            }
        )

        # Org unit type depth
        if obj.org_unit_type and obj.org_unit_type.depth is not None:
            extensions.append(
                {
                    "url": "http://iaso.org/fhir/StructureDefinition/org-unit-type-depth",
                    "valueInteger": obj.org_unit_type.depth,
                }
            )

        # Source version
        if obj.version:
            extensions.append(
                {
                    "url": "http://iaso.org/fhir/StructureDefinition/source-version",
                    "valueString": str(obj.version.number),
                }
            )

        # Opening date
        if obj.opening_date:
            extensions.append(
                {
                    "url": "http://iaso.org/fhir/StructureDefinition/opening-date",
                    "valueDate": obj.opening_date.isoformat(),
                }
            )

        # Closing date
        if obj.closed_date:
            extensions.append(
                {
                    "url": "http://iaso.org/fhir/StructureDefinition/closed-date",
                    "valueDate": obj.closed_date.isoformat(),
                }
            )

        return extensions


class FHIRBundleSerializer(serializers.Serializer):
    """
    Serializer for FHIR Bundle resources containing Location entries
    """

    resourceType = serializers.CharField(default="Bundle", read_only=True)
    id = serializers.CharField(read_only=True)
    meta = serializers.DictField(read_only=True)
    type = serializers.CharField(default="searchset", read_only=True)
    total = serializers.IntegerField(read_only=True)
    link = serializers.ListField(child=serializers.DictField(), read_only=True)
    entry = serializers.ListField(child=serializers.DictField(), read_only=True)


class FHIROperationOutcomeSerializer(serializers.Serializer):
    """
    Serializer for FHIR OperationOutcome resources (errors)
    """

    resourceType = serializers.CharField(default="OperationOutcome", read_only=True)
    issue = serializers.ListField(child=serializers.DictField(), read_only=True)


class FHIRCapabilityStatementSerializer(serializers.Serializer):
    """
    Serializer for FHIR CapabilityStatement resource
    """

    resourceType = serializers.CharField(default="CapabilityStatement", read_only=True)
    status = serializers.CharField(default="active", read_only=True)
    date = serializers.CharField(read_only=True)
    publisher = serializers.CharField(default="Iaso", read_only=True)
    kind = serializers.CharField(default="instance", read_only=True)
    software = serializers.DictField(read_only=True)
    fhirVersion = serializers.CharField(default="4.0.1", read_only=True)
    format = serializers.ListField(default=["json"], read_only=True)
    rest = serializers.ListField(child=serializers.DictField(), read_only=True)
