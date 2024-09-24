# Generated by Django 3.2.22 on 2024-03-06 13:27

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("polio", "0167_auto_20240226_1352"),
    ]

    operations = [
        migrations.CreateModel(
            name="CampaignType",
            fields=[
                ("id", models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=100, unique=True)),
            ],
        ),
        migrations.AddField(
            model_name="campaign",
            name="campaign_types",
            field=models.ManyToManyField(blank=True, related_name="campaigns", to="polio.CampaignType"),
        ),
    ]