# Generated by Django 3.2.15 on 2022-10-10 12:17

from django.db import migrations, models

import plugins.polio.budget.models


class Migration(migrations.Migration):
    dependencies = [
        ("polio", "0096_rename_html_template"),
    ]

    operations = [
        migrations.AlterField(
            model_name="mailtemplate",
            name="html_template",
            field=models.TextField(
                help_text="HTML Template for the Email body, use the Django Template language, see https://docs.djangoproject.com/en/4.1/ref/templates/language/ for reference",
                validators=[plugins.polio.budget.models.validator_template],
            ),
        ),
    ]
