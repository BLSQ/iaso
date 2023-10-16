# Generated by Django 3.2.21 on 2023-10-12 08:52

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0235_merge_20231006_0940"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("polio", "0148_merge_20231002_1610"),
    ]

    operations = [
        migrations.CreateModel(
            name="BudgetProcess",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("deleted_at", models.DateTimeField(blank=True, default=None, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "created_by",
                    models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to=settings.AUTH_USER_MODEL),
                ),
                (
                    "created_by_team",
                    models.ForeignKey(
                        blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, to="iaso.team"
                    ),
                ),
                ("rounds", models.ManyToManyField(related_name="budget_process_rounds", to="polio.Round")),
                ("teams", models.ManyToManyField(blank=True, related_name="budget_process_teams", to="iaso.Team")),
            ],
            options={
                "verbose_name_plural": "Budget Processes",
                "ordering": ["-updated_at"],
            },
        ),
    ]
