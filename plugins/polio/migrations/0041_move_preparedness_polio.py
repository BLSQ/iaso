from django.db import migrations


def move_preparedness_to_round(apps, schema_editor):
    Campaign = apps.get_model("polio", "Campaign")
    Round = apps.get_model("polio", "Round")
    campaigns = Campaign.objects.filter(preperadness_spreadsheet_url__isnull=False)
    for c in campaigns:
        if not c.round_one:
            round = Round()
        else:
            round = c.round_one
        if round.preparedness_spreadsheet_url:
            print(f"{c} - {round}, already has a spreadsheet, skipping")
        round.preparedness_spreadsheet_url = c.preperadness_spreadsheet_url

        round.save()
        if not c.round_one:
            c.round_one = round
            c.save()


class Migration(migrations.Migration):
    dependencies = [
        ("polio", "0040_round_preparedness_sync_status"),
    ]

    operations = [migrations.RunPython(move_preparedness_to_round, migrations.RunPython.noop)]
