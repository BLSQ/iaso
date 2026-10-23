import dataclasses
import typing

from django.db import models


if typing.TYPE_CHECKING:
    from iaso.models import FormVersion


class ConfigurationImpactKind(models.TextChoices):
    """What reads the question, see each domain's module."""

    LOCATION_FIELD = "location_field", "GPS location question of the form"
    DEVICE_FIELD = "device_field", "Device question of the form"
    CORRELATION_FIELD = "correlation_field", "Correlation question of the form"
    LABEL_KEY = "label_key", "Label of the submissions and entities"
    PREDEFINED_FILTER = "predefined_filter", "Predefined filter"
    ENTITY_TYPE_LIST_FIELD = "entity_type_list_field", "Column of an entity type's list"
    ENTITY_TYPE_DETAIL_FIELD = "entity_type_detail_field", "Field of an entity type's detail"
    ENTITY_TYPE_DUPLICATE_FIELD = "entity_type_duplicate_field", "Duplicate search of an entity type"
    STOCK_RULE = "stock_rule", "Stock rule"
    DHIS2_MAPPING = "dhis2_mapping", "DHIS2 mapping"
    FOLLOW_UP_CONDITION = "follow_up_condition", "Condition of a workflow follow-up"
    CHANGE_MAPPING = "change_mapping", "Mapping of a workflow change"


@dataclasses.dataclass(frozen=True)
class ConfigurationImpact:
    """A question of the form read by some configuration (`kind`), the object to check being `target_id`,
    `target_name`."""

    kind: ConfigurationImpactKind
    question: str
    target_id: int
    target_name: str
    # the JsonLogic reading the question: a predefined filter's or a follow-up's
    condition: typing.Any | None = None
    # workflows only: the link to a workflow version needs its entity type, and what of it reads the question
    entity_type_id: int | None = None
    follow_up_order: int | None = None
    mapping_source: str | None = None
    mapping_target: str | None = None


# What each domain's module implements: the configuration reading the removed or modified questions of the form of
# the previous version
ImpactFunction = typing.Callable[["FormVersion", set[str], set[str]], list[ConfigurationImpact]]
