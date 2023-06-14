from django.db import migrations, models


def add_date_logs_to_existing_campaigns(apps, schema_editor):
    Round = apps.get_model("polio", "Round")
    RoundDateHistoryEntry = apps.get_model("polio", "RoundDateHistoryEntry")
    rounds = Round.objects.all()
    for round in rounds:
        if round.datelogs.count() == 0:
            datelog = RoundDateHistoryEntry.objects.create(
                round=round, started_at=round.started_at, ended_at=round.ended_at, reason="INITIAL_DATA"
            )
            round.datelogs.add(datelog)
            round.save()


def reverse_datelog_addition_to_campaigns(apps, schema_editor):
    Round = apps.get_model("polio", "Round")
    rounds = Round.objects.all()
    for round in rounds:
        if round.datelogs.count() == 1:
            datelog = round.datelogs[0]
            if datelog.modified_by is None:
                datelog.delete


class Migration(migrations.Migration):
    dependencies = [
        ("polio", "0133_alter_rounddatehistoryentry_round"),
    ]

    operations = [migrations.RunPython(add_date_logs_to_existing_campaigns, reverse_datelog_addition_to_campaigns)]
