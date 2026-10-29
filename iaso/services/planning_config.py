from typing import Optional

from django.db import transaction

from iaso.models import Account, Team
from iaso.models.microplanning.plannings import PlanningConfig


class PlanningConfigService:
    @staticmethod
    def get_existing_depths(account: Account) -> set[int]:
        """
        Utility method to get all existing team depths for an account
        """
        return set(Team.objects.filter_for_account(account=account).values_list("path__depth", flat=True).distinct())

    @staticmethod
    @transaction.atomic
    def sync_planning_configs(account: Account, existing_depths: Optional[set[int]] = None) -> None:
        """
        From a team, if the tree structure has changed (depth no longer the same); we should update all the remated planning configs
        """
        if not account:
            return

        if existing_depths is None:
            existing_depths = (
                Team.objects.filter_for_account(account=account).only("path").values_list("path__depth", flat=True)
            )

        PlanningConfig.objects.filter(
            planning__project__account=account,
        ).exclude(level__in=existing_depths).delete()
