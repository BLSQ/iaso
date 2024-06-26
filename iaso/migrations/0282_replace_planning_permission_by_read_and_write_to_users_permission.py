# Generated by Django 4.2.13 on 2024-05-30 08:32

from django.db import migrations


def link_iaso_planning_write_and_read_to_users(apps, schema_editor):
    permission = apps.get_model("auth", "Permission")
    user = apps.get_model("auth", "User")
    old_planning_permission = permission.objects.filter(codename="iaso_planning").first()
    users_linked_old_permission = user.objects.filter(user_permissions=old_planning_permission)
    new_planning_permissions = permission.objects.filter(codename__in=["iaso_planning_write", "iaso_planning_read"])
    for user in users_linked_old_permission:
        user.user_permissions.remove(old_planning_permission)
        user.user_permissions.add(*new_planning_permissions)


def unlink_iaso_planning_write_and_read_to_users(apps, schema_editor):
    permission = apps.get_model("auth", "Permission")
    user = apps.get_model("auth", "User")
    old_planning_permissions = permission.objects.filter(codename__in=["iaso_planning_write", "iaso_planning_read"])
    users_linked_old_permissions = user.objects.filter(user_permissions__in=old_planning_permissions)
    new_planning_permission = permission.objects.filter(codename="iaso_planning").first()
    for user in users_linked_old_permissions:
        user.user_permissions.remove(*old_planning_permissions)
        user.user_permissions.add(new_planning_permission)


class Migration(migrations.Migration):
    dependencies = [
        (
            "iaso",
            "0281_replace_registry_permission_by_read_and_write_to_users_permission",
        ),
    ]

    operations = [
        migrations.RunPython(link_iaso_planning_write_and_read_to_users, unlink_iaso_planning_write_and_read_to_users)
    ]
