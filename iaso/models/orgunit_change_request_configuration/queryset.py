import typing

from django.contrib.auth.models import User, AnonymousUser
from django.db.models import QuerySet

from iaso.models.entity import UserNotAuthError


class OrgUnitChangeRequestConfigurationQuerySet(QuerySet):
    def filter_for_user(self, user: typing.Optional[typing.Union[User, AnonymousUser]]):
        # Authorization & authentication issues will be dealt with later, in another ticket
        # if not user or not user.is_authenticated:
        #     raise UserNotAuthError(f"User not Authenticated")

        profile = user.iaso_profile
        return self.filter(project__account=profile.account)
