from django.utils.translation import gettext_lazy as _
from rest_framework.relations import PrimaryKeyRelatedField

from iaso.models.team import Team, TeamType


class TeamPrimaryKeyRelatedField(PrimaryKeyRelatedField):
    """
    PrimaryKeyRelatedField that checks as well if the team is of provided type
    """

    default_error_messages = {
        "wrong_team_type": _("Invalid team type, expected {expected_type}."),
    }

    def __init__(self, team_type: TeamType, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if not team_type:
            raise ValueError("You must provide a team type")
        self.team_type = team_type

    def to_internal_value(self, data) -> Team:
        qs = super().to_internal_value(data)

        if not isinstance(qs, Team):
            raise ValueError

        if qs.type != self.team_type:
            self.fail("wrong_team_type", expected_type=self.team_type)
        return qs
