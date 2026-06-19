from hat.api_import.models import APIImport
from iaso.models.account_usage.base import AccountUsage, MetricTypeChoices, PeriodTypeChoices
from iaso.models.account_usage.manager import ProxyAccountUsageManager
from iaso.models.base import Profile
from iaso.models.bulk_create_user_csv_file import BulkCreateUserFile
from iaso.models.forms import FormAttachment, FormVersion
from iaso.models.import_gpkg import ImportGPKG
from iaso.models.instances import Instance, InstanceFile
from iaso.models.reports import ReportVersion


class DiskSpaceAccountUsage(AccountUsage):
    """
    Model that's just there for dev purpose, to make it easier to query / increment
    """

    default_period_type = PeriodTypeChoices.ALL_TIME
    metric_type = MetricTypeChoices.DISK_SPACE
    objects = ProxyAccountUsageManager()

    class Meta:
        proxy = True

    def calculate_instances_size(self) -> int:
        """Calculate the instances size for an account"""
        instances = Instance.objects.filter(project__account=self.account)
        return self.sum_size(map(lambda x: x.file, instances))

    def calculate_instances_files_size(self) -> int:
        """Calculate the instances files size for an account"""
        instance_files = InstanceFile.objects.filter(instance__project__account=self.account)
        return self.sum_size(map(lambda x: x.file, instance_files))

    def calculate_form_versions_files_size(self) -> int:
        """Calculate the form versions files size for an account"""
        form_files = FormVersion.objects.filter(form__projects__account=self.account)
        return sum(
            map(lambda x: x.file.size.real if x.file else 0 + x.xls_file.size.real if x.xls_file else 0, form_files)
        )

    def calculate_form_attachments_files_size(self) -> int:
        """Calculate the form attachments files size for an account"""
        form_files = FormAttachment.objects.filter(form__projects__account=self.account)
        return self.sum_size(map(lambda x: x.file, form_files))

    def calculate_reports_size(self) -> int:
        """Calculate the reports size for an account"""
        reports = ReportVersion.objects.filter(report__project__account=self.account)
        return self.sum_size(map(lambda x: x.file, reports))

    def calculate_bulk_create_user_csv_file_size(self) -> int:
        """Calculate the BulkCreateUserCsvFile size for an account"""
        files = BulkCreateUserFile.objects.filter(account=self.account)
        return self.sum_size(map(lambda x: x.file, files))

    def calculate_import_gpkg_file_size(self) -> int:
        """Calculate the ImportGPKG size for an account"""
        imports = ImportGPKG.objects.filter(data_source__projects__account=self.account)
        return self.sum_size(map(lambda x: x.file, imports))

    def calculate_api_import_file_size(self) -> int:
        """Calculate the ImportGPKG size for an account"""
        # Unfortunately, the user is nullable and the information about which project this was used for is lost
        imports = APIImport.objects.filter(user__in=map(lambda p: p.user, Profile.objects.filter(account=self.account)))
        return self.sum_size(map(lambda x: x.file, imports))

    @staticmethod
    def sum_size(files) -> int:
        return sum(map(lambda x: x.size.real if x else 0, files))

    def get_total_usage(self):
        instances_size = self.calculate_instances_size()
        instance_files_size = self.calculate_instances_files_size()
        form_versions_size = self.calculate_form_versions_files_size()
        api_import_size = self.calculate_api_import_file_size()
        forms_attachments_size = self.calculate_form_attachments_files_size()
        reports_size = self.calculate_reports_size()
        bulk_create_users_csv_size = self.calculate_bulk_create_user_csv_file_size()
        import_gpk_size = self.calculate_import_gpkg_file_size()

        return (
            instances_size
            + instance_files_size
            + form_versions_size
            + forms_attachments_size
            + reports_size
            + bulk_create_users_csv_size
            + import_gpk_size
            + api_import_size
        )

    def save(self, *args, **kwargs):
        self.usage = self.get_total_usage()
        super().save(*args, **kwargs)
