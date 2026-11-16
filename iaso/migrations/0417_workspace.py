import django.db.models.deletion

from django.conf import settings
from django.db import migrations, models


SNT_MALARIA_MODULE = "SNT_MALARIA"
WORKSPACE_NAME_MAX_LENGTH = 255
OPENHEXA_ORIGIN = "openhexa"


def create_first_snt_workspaces(apps, schema_editor):
    """Each SNT account gets a workspace named after it, holding its non-OpenHEXA data layers.

    OpenHEXA layers stay shared by the whole account, as do all layers of accounts without a workspace."""
    Account = apps.get_model("iaso", "Account")
    Workspace = apps.get_model("iaso", "Workspace")
    MetricType = apps.get_model("iaso", "MetricType")

    workspaces = Workspace.objects.bulk_create(
        Workspace(account=account, name=account.name[:WORKSPACE_NAME_MAX_LENGTH])
        for account in Account.objects.filter(modules__contains=[SNT_MALARIA_MODULE])
    )
    for workspace in workspaces:
        MetricType.objects.filter(account_id=workspace.account_id).exclude(origin=OPENHEXA_ORIGIN).update(
            workspace=workspace
        )


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("iaso", "0416_alter_corepermissionsupport_options_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="Workspace",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("deleted_at", models.DateTimeField(blank=True, default=None, null=True)),
                ("name", models.CharField(max_length=255)),
                ("description", models.TextField(blank=True)),
                (
                    "account",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE, related_name="workspaces", to="iaso.account"
                    ),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="+",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "source_workspace",
                    models.ForeignKey(
                        blank=True,
                        help_text="Workspace this one was duplicated from (provenance only).",
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="+",
                        to="iaso.workspace",
                    ),
                ),
            ],
            options={
                "ordering": ["name"],
            },
        ),
        migrations.AddConstraint(
            model_name="workspace",
            constraint=models.UniqueConstraint(
                condition=models.Q(("deleted_at__isnull", True)),
                fields=("account", "name"),
                name="iaso_workspace_account_name_uniq",
            ),
        ),
        migrations.AddField(
            model_name="metrictype",
            name="workspace",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="metric_types",
                to="iaso.workspace",
            ),
        ),
        migrations.RunPython(create_first_snt_workspaces, migrations.RunPython.noop),
    ]
