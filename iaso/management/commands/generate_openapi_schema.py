import json
import random
import string

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from drf_spectacular.settings import spectacular_settings
from rest_framework.request import Request
from rest_framework.test import APIRequestFactory

from iaso.models import Account, Profile


class Command(BaseCommand):
    """
    A management command to generate an open api schema file

    """

    def add_arguments(self, parser):
        parser.add_argument(
            "-f", "--file", help="Output file", type=str, dest="output_file", default="openapi.json", required=False
        )

    @staticmethod
    def get_random_string(self, size=6, chars=string.ascii_uppercase + string.digits):
        return "".join(random.choice(chars) for _ in range(size))

    @transaction.atomic
    def handle(self, *args, **options):
        factory = APIRequestFactory()
        request = factory.get("/swagger/?format=json")

        # inject a user (or create one)
        created = False
        account = None
        profile = None

        user = get_user_model().objects.filter(iaso_profile__isnull=False, iaso_profile__account__isnull=False).first()

        if not user:
            # create one
            user = get_user_model().objects.create(
                username=f"test-{self.get_random_string(8)}",
                password=self.get_random_string(8),
                is_staff=True,
                is_superuser=True,
            )
            account = Account.objects.create(name=f"random-account-{self.get_random_string(8)}")
            profile = Profile.objects.create(user=user, account=account)
            created = True

        request.user = user
        request = Request(request)

        generator_class = spectacular_settings.DEFAULT_GENERATOR_CLASS

        schema = generator_class().get_schema(request=request, public=False)

        with open(options["output_file"], "w") as f:
            json.dump(schema, f, indent=2)

        if created:
            user.delete()
            account.delete()
            profile.delete()
