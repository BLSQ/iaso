from django.db import transaction

from iaso.models import Planning, Team
from iaso.models.microplanning.plannings import PlanningConfig


class PlanningConfigService:
    @staticmethod
    @transaction.atomic
    def sync_planning_configs(planning: Planning) -> None:
        account = getattr(getattr(planning, "project", None), "account", None)

        existing_depths = set(
            Team.objects.filter_for_account(
                account=account,
            )
            .annotate_with_depth()
            .values_list("depth", flat=True)
            .distinct()
        )

        PlanningConfig.objects.filter(
            planning=planning,
        ).exclude(
            level__in=existing_depths,
        ).delete()
