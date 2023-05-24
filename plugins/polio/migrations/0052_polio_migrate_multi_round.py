# Migrate round from fixed one two campaign to the multi round

from django.db import migrations


def migrate_round(apps, schema_editor):
    Campaign = apps.get_model("polio", "Campaign")
    for c in Campaign.objects.all():
        if c.round_one:
            c.round_one.campaign = c
            c.round_one.number = 1
            c.round_one.save()
        if c.round_two:
            c.round_two.campaign = c
            c.round_two.number = 2
            c.round_two.save()


class Migration(migrations.Migration):
    dependencies = [
        ("polio", "0051_auto_20220415_1302"),
    ]

    operations = [
        migrations.RunPython(migrate_round),
    ]
