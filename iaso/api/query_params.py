from typing import Optional

from rest_framework import serializers


APP_ID = "app_id"
APP_VERSION = "app_version"
API_IMPORT_ID = "api_import_id"
DATE_FROM = "dateFrom"
DATE_TO = "dateTo"
DEVICE_ID = "deviceId"
DEVICE_OWNERSHIP_ID = "deviceOwnershipId"
END_PERIOD = "endPeriod"
ENKETO_SIGNED = "signed"
ENKETO_EXPIRES = "expires"
ENTITY_ID = "entityId"
FORM_ID = "form_id"
FORM_IDS = "form_ids"
IDS = "ids"
IMAGE_ONLY = "image_only"
INCLUDE_CREATION = "include_creation"
JSON_CONTENT = "jsonContent"
LIMIT = "limit"
MODIFICATION_DATE_FROM = "modificationDateFrom"
MODIFICATION_DATE_TO = "modificationDateTo"
ORDER = "order"
ORG_UNIT_ID = "orgUnitId"
ORG_UNIT_PARENT_ID = "orgUnitParentId"
ORG_UNIT_TYPE_ID = "orgUnitTypeId"
ORG_UNIT_TYPE_IDS = "orgUnitTypeIds"
PAGE = "page"
PERIOD = "period"
PERIOD_IDS = "period_ids"
PERIODS = "periods"
PROJECT = "project"
PROJECT_ID = "project_id"
PROJECT_IDS = "project_ids"
PLANNING_IDS = "planningIds"
SEARCH = "search"
SENT_DATE_FROM = "sentDateFrom"
SENT_DATE_TO = "sentDateTo"
SHOW_DELETED = "showDeleted"
SOURCE_VERSION_ID = "source_version_id"
START_PERIOD = "startPeriod"
STATUS = "status"
TYPE = "type"
USER_IDS = "userIds"
WITH_LOCATION = "withLocation"
ONLY_REFERENCE = "onlyReference"
REFERENCE_INSTANCES = "referenceInstances"


def parse_strict_boolean_param(value: Optional[str], field_name: str = "query_param") -> bool:
    """Parse a boolean-like query parameter, accepting the same values as DRF's BooleanField."""
    if value is None:
        return False
    lowered = value.lower()
    if lowered in ("t", "true", "1", "on", "yes"):
        return True
    if lowered in ("f", "false", "0", "off", "no"):
        return False
    raise serializers.ValidationError(
        {field_name: f"Invalid boolean value '{value}'. Expected 'true', 'false', '1' or '0'."}
    )
