from iaso.models.base import User


def get_creator_name(creator: User = None, username: str = "", first_name: str = "", last_name: str = "") -> str:
    if isinstance(creator, User):
        username = creator.username
        first_name = creator.first_name
        last_name = creator.last_name
    if username or first_name or last_name:
        return f"{username} ({first_name} {last_name})"
    elif username:
        return username
    return ""
