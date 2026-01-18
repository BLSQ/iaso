from argparse import ArgumentParser
from logging import getLogger

from django.core.management.base import BaseCommand
from django.db.models import Prefetch

from iaso.models.base import Account
from iaso.models.data_store import JsonDataStore
from plugins.polio.api.lqas_im.lqas_data_manager import LqasDataManager


logger = getLogger(__name__)


class Command(BaseCommand):
    def add_arguments(self, parser: ArgumentParser):
        parser.add_argument(
            "--update",
            action="store_true",
            required=False,
            default=False,
            help="overwrite existing data with datastore data",
        )

    def handle(self, update, *args, **options):
        accounts = Account.objects.prefetch_related(
            Prefetch(
                "jsondatastore_set",
                queryset=JsonDataStore.objects.filter(slug__contains="lqas"),
                to_attr="lqas_datastores",
            )
        ).all()

        for account in accounts:
            manager = LqasDataManager(account=account)
            for datastore in account.lqas_datastores:
                data = datastore.content
                if update:
                    manager.parse_json_and_update_lqas_activities(data)
                else:
                    manager.parse_json_and_create_lqas_activities(data)
