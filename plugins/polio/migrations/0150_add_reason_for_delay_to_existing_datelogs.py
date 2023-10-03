from django.db import migrations, models


def add_reason_for_delay_to_datelog(apps, schema_editor):
    ReasonForDelay = apps.get_model("polio", "ReasonForDelay")
    RoundDateHistoryEntry = apps.get_model("polio", "RoundDateHistoryEntry")
    round_date_history_entries = RoundDateHistoryEntry.objects.all()
    for entry in round_date_history_entries:
        reason_for_delay = ReasonForDelay.objects.filter(key_name=entry.reason)
        entry.reason_for_delay = reason_for_delay
        entry.save()


class Migration(migrations.Migration):
    dependencies = [
        ("polio", "0149_create_reasons_for_delay"),
    ]

    operations = [migrations.RunPython(add_reason_for_delay_to_datelog, None)]
