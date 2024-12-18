from django.db import migrations


class Migration(migrations.Migration):
    """Remove perm iaso_beneficiary from user who have it before deleting it"""

    def remove_perm(apps, schema_editor):
        Permission = apps.get_model("auth", "Permission")
        perm = Permission.objects.filter(codename="iaso_beneficiaries").first()
        if not perm:
            return

        User = apps.get_model("auth", "User")

        users = User.objects.filter(user_permissions=perm)

        for user in users:
            user.user_permissions.remove(perm)

    dependencies = [
        ("iaso", "0177_delete_iaso_beneficiaries"),
    ]

    operations = [
        migrations.RunPython(remove_perm, migrations.RunPython.noop),
    ]
