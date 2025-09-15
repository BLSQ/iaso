from django.db import migrations


def create_initial_campaign_types(apps, schema_editor):
    CampaignType = apps.get_model("polio", "CampaignType")
    CampaignType.objects.create(name="Polio")


class Migration(migrations.Migration):
    dependencies = [
        ("polio", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(create_initial_campaign_types),
    ]
