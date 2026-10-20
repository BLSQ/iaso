import base64
import json

from typing import Optional

from rest_framework import serializers
from rest_framework.settings import api_settings


APP_ID = "app_id"
APP_VERSION = "app_version"
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
FORM_VERSION_IDS = "form_version_ids"
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
CURSOR = "cursor"
WITH_LOCATION = "withLocation"
ONLY_REFERENCE = "onlyReference"
REFERENCE_INSTANCES = "referenceInstances"
ORG_UNIT_STATUS = "org_unit_status"
WORKFLOW_IDS = "workflow_ids"
VALIDATION_STATUS = "validation_status"


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


def encode_cursor(model: str, after_id: int) -> str:
    """Keyset pagination `next_cursor`: opaque on purpose (like a GraphQL cursor), clients pass it back
    as is and never build it, so what it holds (the id of the page's last row) can change without a
    client update. `model` (e.g. "entities") keeps a cursor from one endpoint from paging another.
    Base64url without padding: nothing to escape in a query string."""
    payload = json.dumps({"model": model, "after": after_id}, separators=(",", ":")).encode()
    return base64.urlsafe_b64encode(payload).decode().rstrip("=")


def get_cursor_id(request, model: str) -> Optional[int]:
    """The id a `cursor` (from `encode_cursor` for the same `model`) pages after. Only valid with the
    default id ordering: `id > cursor` under another `order` would skip rows.

    An empty `cursor` is no cursor (the page is served by `page`, counted); a cursor that can't be
    decoded, or was issued for another model, is a client bug: 400."""
    value = request.query_params.get(CURSOR)
    if not value:
        return None
    if api_settings.ORDERING_PARAM in request.query_params:
        raise serializers.ValidationError(
            {CURSOR: f"'{CURSOR}' can't be combined with '{api_settings.ORDERING_PARAM}', it pages by id."}
        )
    try:
        payload = json.loads(base64.urlsafe_b64decode(value + "=" * (-len(value) % 4)))
        cursor_model, cursor_id = payload["model"], payload["after"]
    except (ValueError, TypeError, KeyError):
        raise serializers.ValidationError({CURSOR: f"Invalid cursor '{value}'."})
    if cursor_model != model:
        raise serializers.ValidationError({CURSOR: f"This cursor pages '{cursor_model}', not '{model}'."})
    if type(cursor_id) is not int or cursor_id < 0:
        raise serializers.ValidationError({CURSOR: f"Invalid cursor '{value}'."})
    return cursor_id
