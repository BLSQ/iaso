# Allow Record.age to be unset when import data does not provide age (e.g. follow-up forms).

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("active_list", "0012_alter_record_sex_nullable"),
    ]

    operations = [
        migrations.AlterField(
            model_name="record",
            name="age",
            field=models.IntegerField(blank=True, null=True, verbose_name="Âge"),
        ),
    ]
