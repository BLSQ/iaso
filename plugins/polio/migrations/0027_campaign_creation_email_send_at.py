# Generated by Django 3.1.12 on 2021-09-16 12:06

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("polio", "0026_auto_20210903_0821"),
    ]

    operations = [
        migrations.AddField(
            model_name="campaign",
            name="creation_email_send_at",
            field=models.DateTimeField(blank=True, help_text="When and if we sent an email for creation", null=True),
        ),
    ]
