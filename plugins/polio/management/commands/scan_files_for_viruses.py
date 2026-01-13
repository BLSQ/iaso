from typing import Optional, Tuple

from django.core.management.base import BaseCommand

from iaso.utils.virus_scan.clamav import scan_disk_file_for_virus
from iaso.utils.virus_scan.model import ModelWithFile, VirusScanStatus
from plugins.polio.models import (
    DestructionReport,
    IncidentReport,
    NotificationImport,
    OutgoingStockMovement,
    VaccineRequestForm,
)


class Command(BaseCommand):
    help = "[POLIO] Scan unscanned files for viruses"

    def _scan_files(self, clazz: type[ModelWithFile], name: str) -> Tuple[int, int, int]:
        queryset = clazz.objects.filter(file_scan_status=VirusScanStatus.PENDING)
        self.stdout.write(f" - {name}: {queryset.count()}")
        clean, infected, errors = 0, 0, 0
        for model_with_file in queryset.all():
            # No need for try/except, `scan_disk_file_for_virus` is already wrapped.
            result, timestamp = scan_disk_file_for_virus(model_with_file.file.path)
            model_with_file.file_last_scan = timestamp
            model_with_file.file_scan_status = result
            model_with_file.save()
            if result is VirusScanStatus.CLEAN:
                clean += 1
                self.stdout.write(self.style.SUCCESS(f"   -> file: {model_with_file.file.name} is clean ✔"))
            elif result is VirusScanStatus.INFECTED:
                infected += 1
                self.stdout.write(self.style.ERROR(f"   -> file: {model_with_file.file.name} is infected ☠️"))
            else:
                errors += 1
                self.stdout.write(
                    self.style.WARNING(f"   -> file: {model_with_file.file.name} could not be scanned ❌")
                )
        self.stdout.write(self.style.SUCCESS(f"   clean : {clean}, infected: {infected}, errors: {errors}"))
        return clean, infected, errors

    def handle(self, *args, **options) -> Optional[str]:
        self.stdout.write("Scanning files for viruses...")
        self._scan_files(VaccineRequestForm, "Vaccine Request Forms")
        self._scan_files(OutgoingStockMovement, "Form As")
        self._scan_files(DestructionReport, "Destruction Reports")
        self._scan_files(IncidentReport, "Incident Reports")
        self._scan_files(NotificationImport, "Notifications")
        self.stdout.write(self.style.SUCCESS("Scan done!"))
