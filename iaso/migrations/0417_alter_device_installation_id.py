from django.db import migrations, models


def drop_installation_id_unique(apps, schema_editor):
    """The original 0415 made installation_id unique and already ran on some environments (staging, dev), not on prod.

    Drop whatever constraint/index is left on the column so every environment ends up with the plain index below.
    """
    connection = schema_editor.connection
    with connection.cursor() as cursor:
        constraints = connection.introspection.get_constraints(cursor, "iaso_device")
    for name, info in constraints.items():
        if info["primary_key"] or info["columns"] != ["installation_id"]:
            continue
        if info["unique"] and not info["index"]:
            schema_editor.execute(f"ALTER TABLE iaso_device DROP CONSTRAINT {schema_editor.quote_name(name)}")
        else:
            schema_editor.execute(f"DROP INDEX {schema_editor.quote_name(name)}")


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0416_alter_corepermissionsupport_options_and_more"),
    ]

    operations = [
        migrations.RunPython(drop_installation_id_unique, migrations.RunPython.noop, elidable=True),
        migrations.AlterField(
            model_name="device",
            name="installation_id",
            field=models.CharField(db_index=True, max_length=250),
        ),
    ]
