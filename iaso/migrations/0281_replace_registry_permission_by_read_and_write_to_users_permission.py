# Generated by Django 4.2.13 on 2024-05-28 11:47

from django.db import migrations


def link_iaso_registry_write_and_read_to_users(apps, schema_editor):
    permission = apps.get_model("auth", "Permission")
    user = apps.get_model("auth", "User")
    old_registry_permission = permission.objects.filter(codename="iaso_registry").first()
    users_linked_old_permission = user.objects.filter(user_permissions=old_registry_permission)
    new_registry_permissions = permission.objects.filter(codename__in=["iaso_registry_write", "iaso_registry_read"])
    for user in users_linked_old_permission:
        user.user_permissions.remove(old_registry_permission)
        user.user_permissions.add(*new_registry_permissions)


def unlink_iaso_registry_write_and_read_to_users(apps, schema_editor):
    permission = apps.get_model("auth", "Permission")
    user = apps.get_model("auth", "User")
    old_registry_permissions = permission.objects.filter(codename__in=["iaso_registry_write", "iaso_registry_read"])
    users_linked_old_permissions = user.objects.filter(user_permissions__in=old_registry_permissions)
    new_registry_permission = permission.objects.filter(codename="iaso_registry").first()
    for user in users_linked_old_permissions:
        user.user_permissions.remove(*old_registry_permissions)
        user.user_permissions.add(new_registry_permission)


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0280_datasource_tree_config_status_fields"),
    ]

    operations = [
        migrations.RunPython(link_iaso_registry_write_and_read_to_users, unlink_iaso_registry_write_and_read_to_users)
    ]
