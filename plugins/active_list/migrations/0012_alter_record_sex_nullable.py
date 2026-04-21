# Allow Record.sex to be unset when import data does not provide gender.

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("active_list", "0011_alter_record_patient"),
    ]

    operations = [
        migrations.AlterField(
            model_name="record",
            name="sex",
            field=models.TextField(
                blank=True,
                choices=[("MALE", "H"), ("FEMALE", "F")],
                null=True,
                verbose_name="Sexe",
            ),
        ),
    ]
