from hat.planning.models import  Planning


from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Copy planning'

    def add_arguments(self, parser):
        parser.add_argument(
            '--id',
            action='store',
            dest='identifier',
            help='planning identifier',
        )

    def handle(self, *args, **options):
        identifier = options.get('identifier', None)
        if identifier is None:
            print("You should specify an identifier with the --id xx syntax")
            return
        planning = Planning.objects.get(pk=identifier)
        planning.copy(planning.name + " - copy")


