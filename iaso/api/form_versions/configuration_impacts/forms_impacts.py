import typing

from iaso.models import FormPredefinedFilter
from iaso.utils.jsonlogic import variables

from .common import ConfigurationImpactKind, impact


if typing.TYPE_CHECKING:
    from iaso.models import FormVersion


def forms_impacts(
    previous_form_version: "FormVersion",
    removed_question_names: typing.Set[str],
    modified_question_names: typing.Set[str],
) -> typing.List[dict]:
    """The form's own configuration:
    - `location_field`, `device_field`, `correlation_field`: its GPS, device (`deviceid` when not set) or correlation
      question (target: the form), the last one making the processing of new submissions fail;
    - `label_key`: its submissions and entities are labelled with it (target: the form);
    - `predefined_filter`: a predefined filter's JsonLogic reads it (target: the filter)."""
    question_names = removed_question_names | modified_question_names
    form = previous_form_version.form
    impacts = []

    fields = (
        (ConfigurationImpactKind.LOCATION_FIELD, form.location_field),
        (
            ConfigurationImpactKind.DEVICE_FIELD,
            form.device_field or "deviceid",
        ),  # the default of `Instance.convert_device()`
        (ConfigurationImpactKind.CORRELATION_FIELD, form.correlation_field),
    )
    for kind, name in fields:
        if name in question_names:
            impacts.append(impact(kind, name, form.id, form.name))
    for name in sorted(set(form.label_keys or []) & question_names):
        impacts.append(impact(ConfigurationImpactKind.LABEL_KEY, name, form.id, form.name))

    for predefined_filter in FormPredefinedFilter.objects.filter(form=form).order_by("id"):
        for name in sorted(set(variables(predefined_filter.json_logic)) & question_names):
            impacts.append(
                impact(
                    ConfigurationImpactKind.PREDEFINED_FILTER,
                    name,
                    predefined_filter.id,
                    predefined_filter.name,
                    condition=predefined_filter.json_logic,
                )
            )
    return impacts
