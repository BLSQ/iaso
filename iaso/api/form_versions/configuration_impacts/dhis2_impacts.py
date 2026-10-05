import typing

from iaso.dhis2.form_mapping import mapped_question_names
from iaso.models import MappingVersion

from .common import ConfigurationImpactKind, impact


if typing.TYPE_CHECKING:
    from iaso.models import FormVersion


def dhis2_impacts(
    previous_form_version: "FormVersion",
    removed_question_names: typing.Set[str],
    modified_question_names: typing.Set[str],
) -> typing.List[dict]:
    """`dhis2_mapping`: a DHIS2 mapping of `previous_form_version` exports it, and it is removed: the new version's copy
    of the mapping won't (target: the mapping version). Its modified questions being kept by the copy, not there."""
    mapping_versions = MappingVersion.objects.filter(form_version=previous_form_version).select_related("mapping")
    impacts = []
    for mapping_version in mapping_versions.order_by("id"):
        mapping = mapping_version.mapping
        for name in sorted(mapped_question_names(mapping_version.json) & removed_question_names):
            impacts.append(
                impact(
                    ConfigurationImpactKind.DHIS2_MAPPING,
                    name,
                    mapping_version.id,
                    f"{mapping.name} ({mapping.mapping_type})",
                )
            )
    return impacts
