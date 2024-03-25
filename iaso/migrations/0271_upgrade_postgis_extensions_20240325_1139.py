from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0270_auto_20240314_1515"),
    ]

    operations = [migrations.RunSQL("SELECT postgis_extensions_upgrade();")]
