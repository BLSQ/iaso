from hat.planning.algo import sort_villages, assign
from hat.geo.models import Village
from hat.planning.models import Assignation, Planning, WorkZone
from hat.users.models import Coordination

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
        original_planning_id = planning.id

        planning.name = planning.name + " - copy"
        planning.id = None
        planning.save()

        assignations = Assignation.objects.filter(planning_id=original_planning_id)

        for assignation in assignations:
            assignation.pk = None
            assignation.planning_id = planning.id
            assignation.save()

        workzones = WorkZone.objects.filter(planning_id=original_planning_id)

        for workzone in workzones:
            as_list = list(workzone.AS.all())
            team_list = list(workzone.teams.all())

            workzone.pk = None
            workzone.planning_id = planning.id
            workzone.save()

            workzone.AS.clear()
            workzone.AS.set(as_list)

            workzone.teams.clear()
            workzone.teams.set(team_list)



