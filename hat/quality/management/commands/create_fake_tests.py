from hat.geo.models import Village
from hat.cases.models import Case
from hat.sync.models import ImageUpload, VideoUpload
from hat.quality.models import Test
from hat.users.models import Team
from hat.constants import PG
from django.core.management.base import BaseCommand
import random
from django.utils import timezone


class Command(BaseCommand):
    help = 'Create fake tests for quality control'

    def handle(self, *args, **options):
        for video in VideoUpload.objects.all()[:200]:

            test = Test()
            test.type = PG
            test.date = timezone.now()
            test.result = random.randint(-3, 4)
            test.village = Village.objects.all()[0]
            test.team = Team.objects.all()[random.randint(0, 1)]
            test.form = Case.objects.all()[0]
            test.video = video
            test.save()

        print("Video tests created")

        for image in ImageUpload.objects.all()[:200]:

            test = Test()
            test.type = image.type
            test.date = timezone.now()
            test.result = random.randint(-3, 4)
            test.village = Village.objects.all()[0]
            test.team = Team.objects.all()[random.randint(0, 1)]
            test.form = Case.objects.all()[0]
            test.image = image
            test.save()

        print("Image tests created")
