from iaso.models import OrgUnit


PHYSICAL_TYPE_MAPPING = {
    "COUNTRY": "co",  # Country
    "REGION": "area",  # Area
    "DISTRICT": "area",  # Area
    "HF": "bu",  # Building
}

DEFAULT_PHYSICAL_TYPE = "si"

STATUS_MAPPING = {
    "active": OrgUnit.VALIDATION_VALID,
    "inactive": OrgUnit.VALIDATION_NEW,
    "suspended": OrgUnit.VALIDATION_REJECTED,
}

REVERSE_STATUS_MAPPING = {x: y for y, x in STATUS_MAPPING.items()}

FHIR_STATUS_CHOICES = tuple((key, key.capitalize()) for key in STATUS_MAPPING)
