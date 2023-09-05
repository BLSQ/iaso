from django.contrib.auth.models import User
from django.core.management.base import BaseCommand

from iaso.models import Account, Profile, Project


class Command(BaseCommand):
    help = "Create and import data for initial usage of the application"

    def handle(self, *args, **options):
        superusers = User.objects.filter(is_superuser=True)
        if len(superusers) > 0:
            user = superusers[0]
            account = Account(name="test")
            account.save()
            project = Project(name="test", account=account)
            project.save()
            profile = Profile(account=account, user=user)
            profile.save()
            print("Account, project and profile have been successfully created!")
        else:
            print("Please create a superuser before running this command...")
