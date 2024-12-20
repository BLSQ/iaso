from django.core.management.base import BaseCommand
from django.db import transaction

from iaso.models import Account, Entity, EntityType, Instance, InstanceFile, StorageDevice, StorageLogEntry


class Command(BaseCommand):
    """
    This command deletes all form submissions and entities/beneficiaries for a given account.
    It's useful to clean up test/staging environments, or to remove test data from
    production environments right before going live.
    """

    help = "Delete all form submissions and entities/beneficiaries for a given account"

    def add_arguments(self, parser):
        parser.add_argument("--account", type=int, dest="account_id")
        parser.add_argument("--entity_type_id", type=int, dest="entity_type_id")
        parser.add_argument(
            "--dry-run",
            action="store_true",
            dest="dry-run",
            help="Don't actually delete any data",
        )

    def delete_resources(self, description, query, options):
        if options["dry-run"]:
            self.stdout.write(f"{description} {query.count()}")
        else:
            self.stdout.write(f"{description} {query.delete()}")

    def handle(self, *args, **options):
        account_id = options.get("account_id")
        if account_id is None:
            self.stdout.write("Missing argument: No account id provided via --account")
            self.stdout.write("Available accounts:")
            for account in Account.objects.order_by("id").all():
                self.stdout.write(f"\t{account.name}: id {account.id}")
            exit()

        if options["dry-run"]:
            self.stdout.write("NOTE: Running as --dry-run, not changing db")

        account = Account.objects.get(pk=account_id)
        project_ids = list(account.project_set.values_list("id", flat=True))

        entity_type_id = options.get("entity_type_id")
        if entity_type_id:
            entity_type = EntityType.objects.get(pk=entity_type_id, account=account)
            self.stdout.write(f"NOTE: Deleting only for entity type {entity_type}")

        with transaction.atomic():
            self.stdout.write("--------------")
            self.stdout.write(f"Deleting form submissions and entities for account {account.name}")
            if entity_type_id:
                self.stdout.write(f"and entity type {entity_type}")
            self.stdout.write("--------------")
            self.stdout.write()

            self.stdout.write("Deleting form submissions...")
            if entity_type_id:
                instances_to_delete = Instance.objects.filter(entity__entity_type=entity_type)
                entities_to_delete = Entity.objects_include_deleted.filter(account=account, entity_type=entity_type)
            else:
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
            self.stdout.write("DONE.")

            self.stdout.write("Deleting entities...")
            self.delete_resources(
                "\tEntities",
                entities_to_delete,
                options,
            )
            self.stdout.write("DONE.")

            self.stdout.write("Deleting storages...")
            if entity_type_id:
                storages_to_delete = StorageDevice.objects.filter(account=account, entity__entity_type=entity_type)
            else:
                storages_to_delete = StorageDevice.objects.filter(account=account)
            self.delete_resources(
                "\tStorageLogEntry",
                StorageLogEntry.objects.filter(device__in=storages_to_delete),
                options,
            )
            self.delete_resources("\tStorageDevice", storages_to_delete, options)
            self.stdout.write("DONE.")
