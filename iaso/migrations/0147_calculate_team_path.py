from django.db import migrations


def calculate_paths(team, force_recalculate: bool = True):
    """Calculate the path for this Team and all its children recursively.

    This method will check if this instance path should change. If it is the case (or if force_recalculate is
    True), it will update the path property for the instance and its children, and return all the modified
    records.

    Please note that this method does not save the modified records. Instead, they are updated in bulk in the
    save() method.

    :param force_recalculate: calculate path for all descendants, even if this org unit path does not change
    """

    # keep track of updated records
    updated_records = []

    base_path = [] if team.parent is None else list(team.parent.path)
    new_path = [*base_path, str(team.pk)]
    path_has_changed = new_path != team.path

    if path_has_changed:
        team.path = new_path
        updated_records += [team]

    if path_has_changed or force_recalculate:
        for child in team.sub_teams.all():
            updated_records += calculate_paths(child, force_recalculate)

    return updated_records


def calculate_team_paths(apps, schema_editor):
    Team = apps.get_model("iaso", "Team")
    for team in Team.objects.filter(parent_id=None):
        Team.objects.bulk_update(calculate_paths(team), ["path"])


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0146_team_path"),
    ]

    operations = [migrations.RunPython(calculate_team_paths, None)]
