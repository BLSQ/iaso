from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("iaso", "0171_auto_20220920_1749"),
    ]

    operations = [
        migrations.RunSQL(sql="update iaso_orgunit set source_created_at=created_at where source_created_at is null"),
        migrations.RunSQL(sql="update iaso_orgunit set source_updated_at = updated_at where source_updated_at is null"),
    ]
