from dataclasses import dataclass
from typing import TYPE_CHECKING, Sequence

import django.dispatch


if TYPE_CHECKING:
    from iaso.models import Account, Profile


@dataclass(frozen=True)
class ProfileBulkCreatedMessage:
    account: "Account"
    profiles: Sequence["Profile"]


bulk_profiles_created = django.dispatch.Signal()
