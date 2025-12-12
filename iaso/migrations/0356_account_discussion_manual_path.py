# Generated migration for adding discussion_manual_path field to Account model

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0355_merge_20251125_1555"),
    ]

    operations = [
        migrations.AddField(
            model_name="account",
            name="discussion_manual_path",
            field=models.TextField(blank=True, null=True),
        ),
    ]
