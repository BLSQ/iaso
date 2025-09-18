from django.db import migrations


def create_initial_campaign_types(apps, schema_editor):
    CampaignType = apps.get_model("polio", "CampaignType")
    CampaignType.objects.get_or_create(name="Polio", slug="polio")
    CampaignType.objects.get_or_create(name="Measles", slug="measles")
    CampaignType.objects.get_or_create(name="PIRI", slug="piri")
    CampaignType.objects.get_or_create(name="Vitamin A", slug="vitamin-a")
    CampaignType.objects.get_or_create(name="Rubella", slug="rubella")
    CampaignType.objects.get_or_create(name="Deworming", slug="deworming")


class Migration(migrations.Migration):
    dependencies = [
        ("polio", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(create_initial_campaign_types),
    ]
