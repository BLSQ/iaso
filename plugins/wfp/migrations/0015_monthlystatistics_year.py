# Generated by Django 4.2.16 on 2024-11-25 08:55

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("wfp", "0014_merge_20241120_0748"),
    ]

    operations = [
        migrations.AddField(
            model_name="monthlystatistics",
            name="year",
            field=models.CharField(blank=True, max_length=6, null=True),
        ),
    ]
