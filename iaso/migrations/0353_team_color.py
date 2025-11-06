# Generated manually
import random

from django.db import migrations, models

from iaso.utils.colors import COLOR_CHOICES


def assign_random_colors_to_teams(apps, schema_editor):
    """Assign random colors from COLOR_CHOICES to all existing teams"""
    Team = apps.get_model("iaso", "Team")

    # Extract just the hex values from COLOR_CHOICES
    color_values = [color[0] for color in COLOR_CHOICES]

    teams = Team.objects.all()
    for team in teams:
        team.color = random.choice(color_values)

    # Bulk update for efficiency
    Team.objects.bulk_update(teams, ["color"], batch_size=500)


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0352_alter_account_modules"),
    ]

    operations = [
        migrations.AddField(
            model_name="team",
            name="color",
            field=models.CharField(
                default="#ef5350",  # Red 400 - COLOR_CHOICES[0][0]
                max_length=7,
            ),
        ),
        migrations.RunPython(assign_random_colors_to_teams, migrations.RunPython.noop),
    ]
