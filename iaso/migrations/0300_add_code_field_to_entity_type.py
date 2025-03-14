# Generated by Django 4.2.16 on 2024-10-01 14:03

from django.db import migrations, models

from iaso.models import EntityType


def create_entity_type_code(apps, schema_editor):
    entityType = apps.get_model("iaso", "EntityType")
    all_entityTypes = entityType.objects.all()
    for entityType in all_entityTypes:
        entity_type_name = entityType.name.replace(" ", "_")
        entityType.code = f"{entity_type_name.lower()}_{entityType.account_id}"
        entityType.save()


def reverse_create_entity_type_code(apps, schema_editor):
    all_entityTypes = EntityType.objects.all()
    for entityType in all_entityTypes:
        entityType.code = None
        entityType.save()


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0299_merge_0297_entity_merged_to_0298_profile_organization"),
    ]

    operations = [
        migrations.AddField(
            model_name="entitytype",
            name="code",
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.RunPython(create_entity_type_code, reverse_create_entity_type_code),
    ]
