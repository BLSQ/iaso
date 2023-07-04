import logging

from django.db import migrations


class Migration(migrations.Migration):
    def data_migration(apps, schema_editor):
        User = apps.get_model("auth", "User")
        Account = apps.get_model("iaso", "Account")
        Profile = apps.get_model("iaso", "Profile")

        username = "polio_cron_task_user"
        # Exit early if user already exist
        if User.objects.filter(username=username):
            logging.info(f"user {username} already exist, skipping")
            return

        polio_account = Account.objects.filter(name__in=["polio", "poliotest"]).first()
        if polio_account:
            user = User.objects.create(
                username=username,
                first_name="Automated actions for PolioOutbreaks",
            )
            Profile.objects.create(user=user, account=polio_account)

    dependencies = [
        ("polio", "0122_alter_countryusersgroup_language"),
    ]

    operations = [migrations.RunPython(data_migration, migrations.RunPython.noop)]
