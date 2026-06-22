from hat.api_import.models import APIImport
from iaso.models import (
    BulkCreateUserFile,
    FormAttachment,
    FormVersion,
    ImportGPKG,
    Instance,
    InstanceFile,
    Profile,
    ReportVersion,
)
from iaso.saas.constants import DISK_SPACE_QUOTA, DISK_SPACE_QUOTA_LABEL
from plugins.saas.models.account_usage import PeriodTypeChoices, UsageTypeChoices
from plugins.saas.registry import account_usage_registry


class DiskSpaceAccountUsage:
    @staticmethod
    def calculate_instances_size(account) -> int:
        """Calculate the instances size for an account"""
        instances = Instance.objects.filter(project__account=account)
        return DiskSpaceAccountUsage.sum_size(map(lambda x: x.file, instances))

    @staticmethod
    def calculate_instances_files_size(account) -> int:
        """Calculate the instances files size for an account"""
        instance_files = InstanceFile.objects.filter(instance__project__account=account)
        return DiskSpaceAccountUsage.sum_size(map(lambda x: x.file, instance_files))

    @staticmethod
    def calculate_form_versions_files_size(account) -> int:
        """Calculate the form versions files size for an account"""
        form_files = FormVersion.objects.filter(form__projects__account=account)
        return sum(
            map(lambda x: x.file.size.real if x.file else 0 + x.xls_file.size.real if x.xls_file else 0, form_files)
        )

    @staticmethod
    def calculate_form_attachments_files_size(account) -> int:
        """Calculate the form attachments files size for an account"""
        form_files = FormAttachment.objects.filter(form__projects__account=account)
        return DiskSpaceAccountUsage.sum_size(map(lambda x: x.file, form_files))

    @staticmethod
    def calculate_reports_size(account) -> int:
        """Calculate the reports size for an account"""
        reports = ReportVersion.objects.filter(report__project__account=account)
        return DiskSpaceAccountUsage.sum_size(map(lambda x: x.file, reports))

    @staticmethod
    def calculate_bulk_create_user_csv_file_size(account) -> int:
        """Calculate the BulkCreateUserCsvFile size for an account"""
        files = BulkCreateUserFile.objects.filter(account=account)
        return DiskSpaceAccountUsage.sum_size(map(lambda x: x.file, files))

    @staticmethod
    def calculate_import_gpkg_file_size(account) -> int:
        """Calculate the ImportGPKG size for an account"""
        imports = ImportGPKG.objects.filter(data_source__projects__account=account)
        return DiskSpaceAccountUsage.sum_size(map(lambda x: x.file, imports))

    @staticmethod
    def calculate_api_import_file_size(account) -> int:
        """Calculate the ImportGPKG size for an account"""
        # Unfortunately, the user is nullable and the information about which project this was used for is lost
        imports = APIImport.objects.filter(user__in=map(lambda p: p.user, Profile.objects.filter(account=account)))
        return DiskSpaceAccountUsage.sum_size(map(lambda x: x.file, imports))

    @staticmethod
    def sum_size(files) -> int:
        return sum(map(lambda x: x.size.real if x else 0, files))

    @staticmethod
    def compute_quota_value(account):
        instances_size = DiskSpaceAccountUsage.calculate_instances_size(account)
        instance_files_size = DiskSpaceAccountUsage.calculate_instances_files_size(account)
        form_versions_size = DiskSpaceAccountUsage.calculate_form_versions_files_size(account)
        api_import_size = DiskSpaceAccountUsage.calculate_api_import_file_size(account)
        forms_attachments_size = DiskSpaceAccountUsage.calculate_form_attachments_files_size(account)
        reports_size = DiskSpaceAccountUsage.calculate_reports_size(account)
        bulk_create_users_csv_size = DiskSpaceAccountUsage.calculate_bulk_create_user_csv_file_size(account)
        import_gpk_size = DiskSpaceAccountUsage.calculate_import_gpkg_file_size(account)

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


account_usage_registry.register(
    name=DISK_SPACE_QUOTA,
    label=DISK_SPACE_QUOTA_LABEL,
    period_type=PeriodTypeChoices.ALL_TIME,
    compute_quota_value=DiskSpaceAccountUsage.compute_quota_value,
    usage_type=UsageTypeChoices.FILESIZE,
)
