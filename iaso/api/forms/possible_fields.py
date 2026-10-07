from typing import Any, Iterable, List, Optional, Sequence

from iaso.models import EntityDuplicateAnalyzis


# Named presets for filtering `possible_fields_with_latest_version`.
# Keep `deduplication` aligned with EntityDuplicateAnalyzis.SUPPORTED_FIELD_TYPES.
POSSIBLE_FIELDS_USAGE_DEDUPLICATION = "deduplication"
POSSIBLE_FIELDS_USAGE_ENTITY_TYPE_CONFIG = "entity_type_config"

# Displayable XLSForm question types for entity type list/detail/search config.
# Based on https://xlsform.org/en/#question-types and types rendered by useGetFieldValue.
# Excludes media (image/audio/video/file), complex geo (geotrace/geoshape), and structural types.
# Frontend doesn't support all types yet, so we need to exclude them from the entity type config.
# You can adapt frontend support by updating the useGetFieldValue function in the hooks/useGetFieldValue.tsx file.
ENTITY_TYPE_CONFIG_FIELD_TYPES = [
    # text / numeric
    "text",
    "integer",
    "decimal",
    "number",
    # "range", Type not supported yet
    "barcode",
    "calculate",
    "note",
    # temporal Type not supported yet
    "date",
    "time",
    "dateTime",
    "datetime",
    "start",
    "end",
    # "today", Type not supported yet
    # choice (exact + with choice-list suffix via prefix match)
    "select one",
    "select_one",
    "select multiple",
    "select_multiple",
    "select all that apply",
    "select_all_that_apply",
    # geo (single point is displayable as a map)
    # "geopoint", Type not supported yet
    # other scalar-ish XLSForm / ODK types
    # "acknowledge",
    # "phonenumber", Type not supported yet
    # "username", Type not supported yet
    # "email", Type not supported yet
    # "deviceid", Type not supported yet
    None,
]

# Prefixes for select_* types that include a choice list name, e.g. "select_one gender".
_SELECT_TYPE_PREFIXES = (
    "select_one ",
    "select one ",
    "select_multiple ",
    "select multiple ",
    "select_all_that_apply ",
    "select all that apply ",
)

POSSIBLE_FIELDS_USAGE_PRESETS = {
    POSSIBLE_FIELDS_USAGE_DEDUPLICATION: EntityDuplicateAnalyzis.SUPPORTED_FIELD_TYPES,
    POSSIBLE_FIELDS_USAGE_ENTITY_TYPE_CONFIG: ENTITY_TYPE_CONFIG_FIELD_TYPES,
}


def field_type_allowed(field_type: Any, allowed_types: Sequence[Any]) -> bool:
    if field_type in allowed_types:
        return True
    if not isinstance(field_type, str):
        return False
    for prefix in _SELECT_TYPE_PREFIXES:
        if field_type.startswith(prefix) and prefix.rstrip() in allowed_types:
            return True
    return False


def filter_possible_fields_by_usage(
    possible_fields: Optional[Iterable[dict]],
    usage: Optional[str] = None,
) -> List[dict]:
    """
    Filter form possible_fields for a given usage preset.

    Unknown / missing usage falls back to deduplication.
    """
    resolved_usage = usage or POSSIBLE_FIELDS_USAGE_DEDUPLICATION
    allowed_types = POSSIBLE_FIELDS_USAGE_PRESETS.get(
        resolved_usage,
        POSSIBLE_FIELDS_USAGE_PRESETS[POSSIBLE_FIELDS_USAGE_DEDUPLICATION],
    )
    return [field for field in (possible_fields or []) if field_type_allowed(field.get("type"), allowed_types)]
