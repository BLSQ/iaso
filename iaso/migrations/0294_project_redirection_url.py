# Generated by Django 4.2.13 on 2024-07-18 13:27

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0293_orgunitchangerequest_kind"),
    ]

    operations = [
        migrations.AddField(
            model_name="project",
            name="redirection_url",
            field=models.URLField(blank=True, null=True),
        ),
    ]