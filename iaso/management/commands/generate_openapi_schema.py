import json
import random
import string

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from django.urls import reverse
from rest_framework.test import APIClient

from iaso.models import Account, Profile


class Command(BaseCommand):
    """
    A management command to generate an open api schema file

    """

    def add_arguments(self, parser):
        parser.add_argument(
            "-f", "--file", help="Output file", type=str, dest="output_file", default="openapi.json", required=False
        )
        parser.add_argument("-u", "--username", help="Username", type=str, dest="username", required=False)

    @staticmethod
    def get_random_string(self, size=6, chars=string.ascii_uppercase + string.digits):
        return "".join(random.choice(chars) for _ in range(size))

    @transaction.atomic
    def handle(self, *args, **options):
        client = APIClient()

        # inject a user (or create one)
        created = False
        account = None
        profile = None

        if options.get("username"):
            user = get_user_model().objects.get(username=options["username"])
        else:
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

        client.force_authenticate(user=user)
        response = client.get(reverse("swagger-schema"), data={"format": "json"})

        with open("openapi.json", "w") as f:
            json.dump(response.json(), f, indent=2)

        if created:
            user.delete()
            account.delete()
            profile.delete()
