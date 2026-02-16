from django.core.management import BaseCommand
from django.db import transaction
from django.db.models import Count

from iaso.models import Entity, Instance


class Command(BaseCommand):
    help = "Clean-up duplicate submissions"

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write("Computing duplicate submissions...")
        duplicates = Instance.objects.values("uuid", "file_name").annotate(total=Count("uuid")).filter(total__gt=1)
        if len(duplicates) <= 0:
            self.stdout.write(self.style.SUCCESS("No duplicate submissions found!"))
            return

        self.stdout.write(self.style.ERROR(f"Duplicates: {len(duplicates)}"))
        single_content, multiple_content, no_content_no_file, no_content_with_file = 0, 0, 0, 0
        for index, duplicate in enumerate(duplicates):
            has_content = Instance.objects.filter(
                uuid=duplicate["uuid"], file_name=duplicate["file_name"], json__isnull=False
            )
            if has_content.count() == 1:
                self.stdout.write(
                    f"{index}. Duplicate with uuid '{duplicate['uuid']}' has only one instance with content."
                )
                self._delete_instances(
                    uuid=duplicate["uuid"], file_name=duplicate["file_name"], first_id=has_content.first().id
                )
                single_content += 1
            elif has_content.count() > 1:
                self.stdout.write(
                    f"{index}. Duplicate with uuid '{duplicate['uuid']}' has {has_content.count()} instances with content."
                )
                # Based on the code of `Instance.import_data`, the first one is always the one that has the data.
                self._delete_instances(
                    uuid=duplicate["uuid"], file_name=duplicate["file_name"], first_id=has_content.first().id
                )
                multiple_content += 1
            else:
                self.stdout.write(f"{index}. Duplicate with uuid '{duplicate['uuid']}' has no instances with content.")
                first = Instance.objects.filter(uuid=duplicate["uuid"], file_name=duplicate["file_name"]).first()
                # First, let's keep only one
                self._delete_instances(uuid=duplicate["uuid"], file_name=duplicate["file_name"], first_id=first.id)
                # We should look if there are Instances with the same `file_name` but no `uuid` and reimport them
                if duplicate["file_name"] is None:
                    self.stdout.write(self.style.ERROR(" - file_name is None, that's odd!"))
                    continue
                # We should use the content of the latest file received.
                file_name = Instance.objects.filter(uuid__isnull=True, file_name=duplicate["file_name"]).order_by(
                    "-created_at"
                )
                if file_name.exists():
                    self.stdout.write(
                        self.style.SUCCESS(f" - Found {file_name.count()} instances with file_name matching.")
                    )
                    file = file_name.first()
                    first.json = file.json
                    first.file = file.file
                    if file.location:
                        first.location = file.location
                        first.accuracy = file.accuracy
                    first.device = file.device
                    if not first.correlation_id:
                        first.correlation_id = file.correlation_id
                    first.save()
                    self.stdout.write(self.style.WARNING(" - Deleting instances with file_name matching."))
                    file_name.delete()
                    no_content_with_file += 1
                else:
                    no_content_no_file += 1
                    self.stdout.write(self.style.WARNING(" - No file_name Instance match!"))

        self.stdout.write(self.style.SUCCESS("\n\n\nSummary:"))
        self.stdout.write(self.style.SUCCESS(f" - Single instance with content corrected: {single_content}"))
        self.stdout.write(self.style.SUCCESS(f" - Multiple instances with content corrected: {multiple_content}"))
        self.stdout.write(self.style.SUCCESS(f" - No instances with content corrected: {no_content_with_file}"))
        self.stdout.write(self.style.WARNING(f" - No instances with content still empty: {no_content_no_file}"))
        duplicates = Instance.objects.values("uuid", "file_name").annotate(total=Count("uuid")).filter(total__gt=1)
        if len(duplicates) <= 0:
            self.stdout.write(self.style.SUCCESS("No duplicate submissions found anymore!"))
        else:
            self.stdout.write(self.style.ERROR(f"Duplicates: {len(duplicates)}"))

    def _delete_instances(self, uuid: str, file_name: str, first_id: str):
        to_delete = Instance.objects.filter(uuid=uuid, file_name=file_name).exclude(id=first_id)
        self.stdout.write(self.style.WARNING(f" - Deleting {to_delete.count()} instances and linked entities"))
        Entity.objects.filter(attributes__in=to_delete).delete()
        to_delete.delete()
