# Generated by Django 3.2.15 on 2023-02-20 15:30

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        (
            "polio",
            "0123_rename_re_submitted_to_orpg_operations_2_at_wfeditable_campaign_re_submitted_to_orpg_operations2_at_",
        ),
    ]

    operations = [
        migrations.AddField(
            model_name="campaign",
            name="approval_confirmed_at_WFEDITABLE",
            field=models.DateField(blank=True, null=True),
        ),
    ]
