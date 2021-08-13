# Generated by Django 3.1.12 on 2021-08-13 13:19

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("polio", "0021_auto_20210805_1750"),
    ]

    operations = [
        migrations.AddField(
            model_name="campaign",
            name="budget_first_draft_submitted_at",
            field=models.DateField(blank=True, null=True, verbose_name="Budget 1st Draft Submission"),
        ),
        migrations.AddField(
            model_name="campaign",
            name="budget_rrt_oprtt_approval_at",
            field=models.DateField(blank=True, null=True, verbose_name="Budget Approval"),
        ),
    ]
