import typing

from iaso.models import EntityType

from .common import ConfigurationImpactKind, impact


if typing.TYPE_CHECKING:
    from iaso.models import FormVersion


def entity_types_impacts(
    previous_form_version: "FormVersion",
    removed_question_names: typing.Set[str],
    modified_question_names: typing.Set[str],
) -> typing.List[dict]:
    """`entity_type_list_field`, `entity_type_detail_field`, `entity_type_duplicate_field`: an entity type of which the
    form is the reference form shows it in its list, its detail or its duplicate search (target: the entity type)."""
    question_names = removed_question_names | modified_question_names
    impacts = []
    for entity_type in EntityType.objects.filter(reference_form_id=previous_form_version.form_id).order_by("id"):
        for kind, names in (
            (ConfigurationImpactKind.ENTITY_TYPE_LIST_FIELD, entity_type.fields_list_view),
            (ConfigurationImpactKind.ENTITY_TYPE_DETAIL_FIELD, entity_type.fields_detail_info_view),
            (ConfigurationImpactKind.ENTITY_TYPE_DUPLICATE_FIELD, entity_type.fields_duplicate_search),
        ):
            for name in sorted(set(names or []) & question_names):
                impacts.append(impact(kind, name, entity_type.id, entity_type.name))
    return impacts
