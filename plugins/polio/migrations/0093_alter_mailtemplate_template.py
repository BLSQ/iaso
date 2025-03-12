# Generated by Django 3.2.15 on 2022-10-06 11:21

from django.db import migrations, models

import plugins.polio.budget.models


class Migration(migrations.Migration):
    dependencies = [
        ("polio", "0092_mailtemplate"),
    ]

    operations = [
        migrations.AlterField(
            model_name="mailtemplate",
            name="template",
            field=models.TextField(
                help_text="Template for the Email, use the Django Template language, see https://docs.djangoproject.com/en/4.1/ref/templates/language/ for reference",
                validators=[plugins.polio.budget.models.validator_template],
            ),
        ),
    ]
