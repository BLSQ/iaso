from django.core.management.base import BaseCommand
from django.db import transaction

from iaso.models import Account, Entity, Instance, InstanceFile, StorageDevice, StorageLogEntry


class Command(BaseCommand):
    """
    This command deletes all form submissions and entities/beneficiaries for a given account.
    It's useful to clean up test/staging environments, or to remove test data from
    production environments right before going live.
    """

    help = "Delete all form submissions and entities/beneficiaries for a given account"

    def add_arguments(self, parser):
        parser.add_argument("--account", type=int, dest="account_id")
        parser.add_argument(
            "--dry-run",
            action="store_true",
            dest="dry-run",
            help="Don't actually delete any data",
        )

    def delete_resources(self, description, query, options):
        if options["dry-run"]:
            print(description, query.count())
        else:
            print(description, query.delete())

    def handle(self, *args, **options):
        account_id = options.get("account_id")
        if account_id is None:
            print("Missing argument: No account id provided via --account")
            print("Available accounts:")
            for account in Account.objects.order_by("id").all():
                print(f"\t{account.name}: id {account.id}")
            exit()

        if options["dry-run"]:
            print("NOTE: Running as --dry-run, not changing db")

        account = Account.objects.get(pk=account_id)
        project_ids = list(account.project_set.values_list("id", flat=True))

        with transaction.atomic():
            print("--------------")
            print(f"Deleting all form submissions and entities for account {account.name}")
            print("--------------")
            print()

            print("Deleting form submissions...")
            instances_to_delete = Instance.objects.filter(form__projects__id__in=project_ids)
            entities_to_delete = Entity.objects_include_deleted.filter(account=account)

            self.delete_resources(
                "\tfile instances",
                InstanceFile.objects.filter(instance__in=instances_to_delete),
                options,
            )
            if not options["dry-run"]:
                # Need to set foreign key relation to NULL to avoid ProtectedError
                entities_to_delete.update(attributes_id=None)
            self.delete_resources("\tinstances", instances_to_delete, options)
            print("DONE.")

            print("Deleting entities...")
            self.delete_resources(
                "\tEntities",
                entities_to_delete,
                options,
            )
            print("DONE.")

            print("Deleting storages...")
            storages_to_delete = StorageDevice.objects.filter(account=account)
            self.delete_resources(
                "\tStorageLogEntry",
                StorageLogEntry.objects.filter(device__in=storages_to_delete),
                options,
            )
            self.delete_resources("\tStorageDevice", storages_to_delete, options)
            print("DONE.")
