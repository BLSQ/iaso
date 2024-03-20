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


def get_org_unit_parents_ref(field_name, org_unit, parent_source_ref_field_names, parent_field_ids):
    if org_unit.get(field_name):
        return org_unit.get(field_name)
    else:
        parent_index = parent_source_ref_field_names.index(field_name)
        parent_ref = org_unit.get(parent_field_ids[parent_index])
        if parent_ref:
            return f"iaso#{parent_ref}"
        return None
