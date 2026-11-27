from __future__ import annotations

import json

from django.contrib.auth import get_user_model
from django.db.models import Count, Func, IntegerField, JSONField, QuerySet, TextField, Value
from django.db.models.functions import Cast

from iaso.api.microplanning.plannings.utils import PlanningOrgUnitTreeQuerySetBuilder
from iaso.models import OrgUnit, Planning
from iaso.models.team import Team, TeamQuerySet


User = get_user_model()


class JsonIntLookup(Func):
    """COALESCE((<jsonb> ->> <key>)::integer, 0)"""

    arg_joiner = " ->> "
    template = "COALESCE((%(expressions)s)::integer, 0)"
    output_field = IntegerField()


def from_dict(mapping: dict, key_expr):
    payload = json.dumps({str(k): v for k, v in mapping.items()})
    return JsonIntLookup(Cast(Value(payload), JSONField()), Cast(key_expr, TextField()))


def compute_ou_totals_by_team_depth(
    parent: Planning, user: User, team_qs: TeamQuerySet | QuerySet[Team]
) -> tuple[dict[int, int], dict[int, int]]:
    """Returns (total_by_depth, total_for_level_by_depth), keyed by team depth."""
    configs = parent.configs.all()
    root = parent.org_unit
    root_level = len(str(root.path).split("."))
    processed_levels = {root_level + config.level - 1 for config in configs}

    # distinct team depths: ~7 rows instead of 100k
    team_depths = set(team_qs.order_by().values_list("path__depth", flat=True).distinct())
    max_ou_depth = max(team_depths, default=0) + root_level

    ou_count_by_depth = dict(
        PlanningOrgUnitTreeQuerySetBuilder()
        .build_queryset(
            queryset=OrgUnit.objects.filter_for_user(user),
            root=root,
            processed_levels=processed_levels,
            configs=configs,
        )
        .order_by()
        .values("depth")
        .annotate(count=Count("pk"))
        .values_list("depth", "count")
    )

    total_for_level_by_depth = {d: ou_count_by_depth.get(d + root_level, 0) for d in team_depths}
    # each OU has a single depth in the tree → summing per-depth counts == COUNT(DISTINCT) over the range
    total_by_depth = {
        d: sum(ou_count_by_depth.get(k, 0) for k in range(d + root_level, max_ou_depth + 1)) for d in team_depths
    }
    return total_by_depth, total_for_level_by_depth
