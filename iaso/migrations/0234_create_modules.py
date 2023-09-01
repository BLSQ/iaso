# Generated by Django 3.2.15 on 2023-09-01 12:30

from django.db import migrations
from iaso.models import Module

MODULES = [
    {"name": "Data collection - Forms", "codename": "DATA_COLLECTION_FORMS"},
    {"name": "Default", "codename": "DEFAULT"},
    {"name": "DHIS2 mapping", "codename": "DHIS2_MAPPING"},
    {"name": "Embedded links", "codename": "EMBEDDED_LINKS"},
    {"name": "Entities", "codename": "ENTITIES"},
    {"name": "External storage", "codename": "EXTERNAL_STORAGE"},
    {"name": "Planning", "codename": "PLANNING"},
    {"name": "Polio project", "codename": "POLIO_PROJECT"},
    {"name": "Registry", "codename": "REGISTRY"},
]


def create_modules(apps, schema_editor):
    for module in MODULES:
        Module.objects.get_or_create(name=module["name"], codename=module["codename"])


def reverse_create_modules(apps, schema_editor):
    Module.objects.all().delete()


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0233_create_module_permission_for_each_permission"),
    ]

    operations = [
        migrations.RunPython(create_modules, reverse_create_modules),
    ]
