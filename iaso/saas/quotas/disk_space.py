from django.db.models import Sum

from hat.api_import.models import APIImport
from iaso.models import (
    BulkCreateUserFile,
    FormAttachment,
    FormVersion,
    ImportGPKG,
    Instance,
    InstanceFile,
    ReportVersion,
)
from plugins.saas.models.account_usage import PeriodTypeChoices, UsageTypeChoices
from plugins.saas.registry import account_usage_registry

from ..constants import DISK_SPACE_QUOTA, DISK_SPACE_QUOTA_LABEL


class DiskSpaceAccountUsage:
    @staticmethod
    def calculate_instances_size(account) -> int:
        """Calculate the instances size for an account"""
        return Instance.objects.filter(project__account=account).aggregate(total=Sum("file_size"))["total"] or 0

    @staticmethod
    def calculate_instances_files_size(account) -> int:
        """Calculate the instances files size for an account"""
        return (
            InstanceFile.objects.filter(instance__project__account=account).aggregate(total=Sum("file_size"))["total"]
            or 0
        )

    @staticmethod
    def calculate_form_versions_files_size(account) -> int:
        """Calculate the form versions files size for an account"""
        result = FormVersion.objects.filter(form__projects__account=account).aggregate(
            total_file=Sum("file_size"),
            total_xls=Sum("xls_file_size"),
        )
        return (result["total_file"] or 0) + (result["total_xls"] or 0)

    @staticmethod
    def calculate_form_attachments_files_size(account) -> int:
        """Calculate the form attachments files size for an account"""
        return (
            FormAttachment.objects.filter(form__projects__account=account).aggregate(total=Sum("file_size"))["total"]
            or 0
        )

    @staticmethod
    def calculate_reports_size(account) -> int:
        """Calculate the reports size for an account"""
        return (
            ReportVersion.objects.filter(report__project__account=account).aggregate(total=Sum("file_size"))["total"]
            or 0
        )

    @staticmethod
    def calculate_bulk_create_user_csv_file_size(account) -> int:
        """Calculate the BulkCreateUserCsvFile size for an account"""
        return BulkCreateUserFile.objects.filter(account=account).aggregate(total=Sum("file_size"))["total"] or 0

    @staticmethod
    def calculate_import_gpkg_file_size(account) -> int:
        """Calculate the ImportGPKG size for an account"""
        return (
            ImportGPKG.objects.filter(data_source__projects__account=account).aggregate(total=Sum("file_size"))["total"]
            or 0
        )

    @staticmethod
    def calculate_api_import_file_size(account) -> int:
        """Calculate the ImportGPKG size for an account"""
        return (
            APIImport.objects.filter(user__iaso_profile__account=account).aggregate(total=Sum("file_size"))["total"]
            or 0
        )

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
