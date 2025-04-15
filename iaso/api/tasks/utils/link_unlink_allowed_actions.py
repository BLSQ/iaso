from enum import Enum


class AllowedActions(Enum):
    LINK = "link"
    UNLINK = "unlink"


def is_allowed_action(action: str) -> bool:
    return action in {a.value for a in AllowedActions}
