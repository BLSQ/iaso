"""Data migration: rename FORM_COPILOT module codename to FORM_AI in existing accounts."""

from django.db import migrations


def rename_form_copilot_to_form_ai(apps, schema_editor):
    Account = apps.get_model("iaso", "Account")
    for account in Account.objects.filter(modules__contains=["FORM_COPILOT"]):
        account.modules = [("FORM_AI" if m == "FORM_COPILOT" else m) for m in account.modules]
        account.save(update_fields=["modules"])


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0378_form_copilot"),
    ]

    operations = [
        migrations.RunPython(rename_form_copilot_to_form_ai, migrations.RunPython.noop),
    ]
