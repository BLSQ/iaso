from django.contrib.auth import get_user_model

from django.core.management.base import BaseCommand, CommandError

from iaso.models import Account, Profile, Project


class Command(BaseCommand):
    help = "Create and import data for testing the entities deduplication feature"

    def add_arguments(self, parser):
        parser.add_argument("username", type=str, help="The username of the user to load")

    def handle(self, *args, **options):
        User = get_user_model()
        username = options["username"]
        try:
            current_user = User.objects.get(username=username)
        except User.DoesNotExist:
            raise CommandError('User "%s" does not exist' % username)

        self.stdout.write(self.style.SUCCESS('Successfully loaded user "%s"' % username))
