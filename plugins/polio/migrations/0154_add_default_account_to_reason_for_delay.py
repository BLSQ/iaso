from django.db import migrations, models


def add_account_to_reason_for_delay(apps, schema_editor):
    ReasonForDelay = apps.get_model("polio", "ReasonForDelay")
    Account = apps.get_model("iaso", "Account")
    polio_account = Account.objects.get(pk=1)
    # Get Account 1 arbitrarily but also because there's only one account in polio
    reasons_for_delay = ReasonForDelay.objects.all()
    for reason in reasons_for_delay:
        if not reason.account:
            reason.account = polio_account
            reason.save()


class Migration(migrations.Migration):
    dependencies = [
        ("polio", "0153_auto_20231005_1341"),
    ]

    operations = [migrations.RunPython(add_account_to_reason_for_delay, None)]
