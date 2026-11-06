from django.db import migrations


SNT_MALARIA_MODULE = "SNT_MALARIA"
WORKSPACE_NAME_MAX_LENGTH = 255


def create_first_snt_workspaces(apps, schema_editor):
    Account = apps.get_model("iaso", "Account")
    Workspace = apps.get_model("iaso", "Workspace")

    accounts_without_workspace = Account.objects.filter(modules__contains=[SNT_MALARIA_MODULE]).exclude(
        workspaces__isnull=False
    )
    Workspace.objects.bulk_create(
        Workspace(account=account, name=account.name[:WORKSPACE_NAME_MAX_LENGTH])
        for account in accounts_without_workspace
    )


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0414_workspace"),
    ]

    operations = [
        migrations.RunPython(create_first_snt_workspaces, migrations.RunPython.noop),
    ]
