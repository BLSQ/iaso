from copy import deepcopy

from iaso.models import StockItemRule, StockRulesVersion, StockRulesVersionsStatus


COPY_OF_PREFIX = "Copy of "


def make_deep_copy_with_relations(orig_version: StockRulesVersion) -> StockRulesVersion:
    new_version = deepcopy(orig_version)
    new_version.id = None

    new_version.name = COPY_OF_PREFIX + orig_version.name
    if len(new_version.name) > StockRulesVersion.NAME_MAX_LENGTH:
        new_version.name = f"Copy of version {new_version.id}"
    new_version.status = StockRulesVersionsStatus.DRAFT
    new_version.save()

    for rule in StockItemRule.objects.filter(version=new_version):
        new_rule = deepcopy(rule)
        new_rule.id = None
        new_rule.version = new_version
        new_rule.save()

    return new_version
