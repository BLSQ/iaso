# Generated by Django 4.2.16 on 2024-11-29 09:51

from django.db import migrations


def delete_unused_scopes(apps, schema_editor):
    CampaignScope = apps.get_model("polio", "CampaignScope")
    RoundScope = apps.get_model("polio", "RoundScope")

    CampaignScope.objects.filter(campaign__separate_scopes_per_round=True).delete()
    RoundScope.objects.filter(round__campaign__isnull=False, round__campaign__separate_scopes_per_round=False).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("polio", "0205_remove_campaign_budget_requested_at_wfeditable_old_and_more"),
    ]

    operations = [migrations.RunPython(delete_unused_scopes, migrations.RunPython.noop, elidable=True)]
