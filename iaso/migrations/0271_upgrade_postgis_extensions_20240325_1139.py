from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0270_auto_20240314_1515"),
    ]

    operations = [migrations.RunSQL('ALTER EXTENSION postgis update to "3.2.1";')]
