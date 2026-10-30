import typing

from iaso.models import StockItemRule

from .common import ConfigurationImpact, ConfigurationImpactKind


if typing.TYPE_CHECKING:
    from iaso.models import FormVersion


def stock_impacts(
    previous_form_version: "FormVersion",
    removed_question_names: set[str],
    modified_question_names: set[str],
) -> list[ConfigurationImpact]:
    """`stock_rule`: a stock rule updates a stock from it (target: the rules version). Deleted rules versions left
    out."""
    rules = StockItemRule.objects.filter(
        form_id=previous_form_version.form_id,
        question__in=removed_question_names | modified_question_names,
        version__deleted_at=None,
    )
    return [
        ConfigurationImpact(
            ConfigurationImpactKind.STOCK_RULE, rule.question, rule.version_id, f"{rule.version.name} / {rule.sku.name}"
        )
        for rule in rules.select_related("version", "sku").order_by("version_id", "order", "id")
    ]
