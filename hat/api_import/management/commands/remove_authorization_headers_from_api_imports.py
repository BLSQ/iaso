import argparse

from urllib.parse import parse_qs

from django.core.management import BaseCommand
from django.db import transaction

from hat.api_import.models import APIImport


DRY_RUN_ARG = "dryrun"
BATCH_SIZE_ARG = "batchsize"


class Command(BaseCommand):
    help = "Clean-up duplicate submissions"

    def add_arguments(self, parser):
        parser.add_argument(f"--{DRY_RUN_ARG}", default=False, action=argparse.BooleanOptionalAction)
        parser.add_argument(f"--{BATCH_SIZE_ARG}", default=1000)

    @transaction.atomic
    def handle(self, *args, **options):
        dry_run = options[DRY_RUN_ARG]
        batch_size = int(options[BATCH_SIZE_ARG])

        # Use a list to collect objects for bulk writing
        objs_to_update = []
        total_modified = 0

        self.stdout.write(self.style.SUCCESS(f"Starting clean-up with a batch size of {batch_size}..."))

        # .iterator() fetches records in chunks to save memory
        iterator = APIImport.objects.filter(headers__isnull=False).all().iterator(chunk_size=batch_size)
        for obj in iterator:
            modified = False

            # Process Headers
            if "HTTP_AUTHORIZATION" in obj.headers:
                obj.headers.pop("HTTP_AUTHORIZATION", None)
                modified = True

            # Process App ID/Version from Query String
            if obj.app_id == "":
                querystring = obj.headers.get("QUERY_STRING", None)
                if querystring:
                    parsed = parse_qs(querystring)
                    obj.app_id = parsed.get("app_id", [""])[0]
                    obj.app_version = parsed.get("app_version", [""])[0]
                    modified = True

            if modified:
                total_modified += 1
                objs_to_update.append(obj)

            # When we hit the batch limit, write to DB and clear list
            if len(objs_to_update) >= batch_size:
                self.bulk_update(objs_to_update, dry_run)
                objs_to_update = []

        # Final batch update for remaining records
        if objs_to_update:
            self.bulk_update(objs_to_update, dry_run)

        self.stdout.write(self.style.SUCCESS(f"Summary: {total_modified} objects modified."))

    def bulk_update(self, objs_to_update, dry_run: bool):
        self.stdout.write(f"Updating {len(objs_to_update)} objects...")
        if dry_run:
            self.stdout.write("Dry-run!")
            return
        APIImport.objects.bulk_update(objs_to_update, ["headers", "app_id", "app_version"])
        self.stdout.write("Done.")
