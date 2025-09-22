from django.contrib.postgres.operations import CreateExtension
from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0344_fill_feature_flags"),
    ]

    operations = [
        CreateExtension("fuzzystrmatch"),
    ]
