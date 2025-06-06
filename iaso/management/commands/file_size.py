from django.core.management.base import BaseCommand

from hat.api_import.models import APIImport
from iaso.models import (
    Account,
    BulkCreateUserCsvFile,
    FormAttachment,
    FormVersion,
    ImportGPKG,
    Instance,
    InstanceFile,
    Profile,
    ReportVersion,
)


ACCOUNT_IDS_PARAM = "account_ids"


class Command(BaseCommand):
    help = "Generate report about data space used by each accounts"

    def add_arguments(self, parser):
        parser.add_argument(f"--{ACCOUNT_IDS_PARAM}", nargs="+", type=int, required=False)

    def handle(self, *args, **options):
        account_ids = options[ACCOUNT_IDS_PARAM]
        if account_ids and len(account_ids) > 0:
            accounts = Account.objects.filter(id__in=account_ids)
        else:
            accounts = Account.objects.all()

        for account in accounts:
            self.stdout.write(msg=f"Generating file size report for {account.name} ({account.id})")
            instances_size = self.calculate_instances_size(account)
            self.stdout.write(msg=f"- Instances: {self.sizeof_fmt(instances_size)}")
            instance_files_size = self.calculate_instances_files_size(account)
            self.stdout.write(msg=f"- Instance files: {self.sizeof_fmt(instance_files_size)}")
            form_versions_size = self.calculate_form_versions_files_size(account)
            api_import_size = self.calculate_api_import_file_size(account)
            self.stdout.write(msg=f"- API Import files: {self.sizeof_fmt(api_import_size)}")
            self.stdout.write(msg=f"- Form Versions files: {self.sizeof_fmt(form_versions_size)}")
            forms_attachments_size = self.calculate_form_attachments_files_size(account)
            self.stdout.write(msg=f"- Form Attachments files: {self.sizeof_fmt(forms_attachments_size)}")
            reports_size = self.calculate_reports_size(account)
            self.stdout.write(msg=f"- Reports files: {self.sizeof_fmt(reports_size)}")
            bulk_create_users_csv_size = self.calculate_bulk_create_user_csv_file_size(account)
            self.stdout.write(msg=f"- Bulk Create User CSV files: {self.sizeof_fmt(bulk_create_users_csv_size)}")
            import_gpk_size = self.calculate_import_gpkg_file_size(account)
            self.stdout.write(msg=f"- Import GPKG files: {self.sizeof_fmt(import_gpk_size)}")

            total = (
                instances_size
                + instance_files_size
                + form_versions_size
                + forms_attachments_size
                + reports_size
                + bulk_create_users_csv_size
                + import_gpk_size
                + api_import_size
            )
            self.stdout.write(self.style.SUCCESS(f"--- TOTAL for {account.name}: {self.sizeof_fmt(total)}"))

    @staticmethod
    def calculate_instances_size(account: Account) -> int:
        """Calculate the instances size for an account"""
        instances = Instance.objects.filter(project__account=account)
        return Command.sum_size(map(lambda x: x.file, instances))

    @staticmethod
    def calculate_instances_files_size(account: Account) -> int:
        """Calculate the instances files size for an account"""
        instance_files = InstanceFile.objects.filter(instance__project__account=account)
        return Command.sum_size(map(lambda x: x.file, instance_files))

    @staticmethod
    def calculate_form_versions_files_size(account: Account) -> int:
        """Calculate the form versions files size for an account"""
        form_files = FormVersion.objects.filter(form__projects__account=account)
        return sum(
            map(lambda x: x.file.size.real if x.file else 0 + x.xls_file.size.real if x.xls_file else 0, form_files)
        )

    @staticmethod
    def calculate_form_attachments_files_size(account: Account) -> int:
        """Calculate the form attachments files size for an account"""
        form_files = FormAttachment.objects.filter(form__projects__account=account)
        return Command.sum_size(map(lambda x: x.file, form_files))

    @staticmethod
    def calculate_reports_size(account: Account) -> int:
        """Calculate the reports size for an account"""
        reports = ReportVersion.objects.filter(report__project__account=account)
        return Command.sum_size(map(lambda x: x.file, reports))

    @staticmethod
    def calculate_bulk_create_user_csv_file_size(account: Account) -> int:
        """Calculate the BulkCreateUserCsvFile size for an account"""
        files = BulkCreateUserCsvFile.objects.filter(account=account)
        return Command.sum_size(map(lambda x: x.file, files))

    @staticmethod
    def calculate_import_gpkg_file_size(account: Account) -> int:
        """Calculate the ImportGPKG size for an account"""
        imports = ImportGPKG.objects.filter(project__account=account)
        return Command.sum_size(map(lambda x: x.file, imports))

    @staticmethod
    def calculate_api_import_file_size(account: Account) -> int:
        """Calculate the ImportGPKG size for an account"""
        # Unfortunately, the user is nullable and the information about which project this was used for is lost
        imports = APIImport.objects.filter(user__in=map(lambda p: p.user, Profile.objects.filter(account=account)))
        return Command.sum_size(map(lambda x: x.file, imports))

    @staticmethod
    def sum_size(files) -> int:
        return sum(map(lambda x: x.size.real if x else 0, files))

    @staticmethod
    def sizeof_fmt(num, suffix="B"):
        """Display a byte size in a human-readable format. Code from https://stackoverflow.com/a/1094933"""
        for unit in ("", "Ki", "Mi", "Gi", "Ti", "Pi", "Ei", "Zi"):
            if abs(num) < 1024.0:
                return f"{num:3.1f}{unit}{suffix}"
            num /= 1024.0
        return f"{num:.1f}Yi{suffix}"
