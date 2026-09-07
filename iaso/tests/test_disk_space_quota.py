import unittest

from django.contrib.auth.models import User

from hat.api_import.models import APIImport
from iaso import models as m
from iaso.plugins import is_saas_plugin_active
from iaso.test import TestCase


if is_saas_plugin_active():
    from iaso.saas.quotas.disk_space import DiskSpaceAccountUsage


@unittest.skipIf(not is_saas_plugin_active(), "SaaS plugin is not loaded in this environment")
class DiskSpaceQuotaTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account = m.Account.objects.create(name="SaaS Account")
        cls.project = m.Project.objects.create(name="SaaS Project", account=cls.account)
        cls.user = User.objects.create_user(username="saas_user", password="password")
        cls.profile = m.Profile.objects.create(user=cls.user, account=cls.account)

        # Instance
        cls.instance = m.Instance.objects.create(project=cls.project)
        m.Instance.objects.filter(pk=cls.instance.pk).update(file_size=100)

        # InstanceFile
        cls.instance_file = m.InstanceFile.objects.create(instance=cls.instance)
        m.InstanceFile.objects.filter(pk=cls.instance_file.pk).update(file_size=200)

        # Form and FormVersion
        cls.form = m.Form.objects.create(name="SaaS Form")
        cls.project.forms.add(cls.form)
        cls.form_version = m.FormVersion.objects.create(form=cls.form, version_id="v1")
        m.FormVersion.objects.filter(pk=cls.form_version.pk).update(file_size=300, xls_file_size=400)

        # FormAttachment
        cls.form_attachment = m.FormAttachment.objects.create(form=cls.form, name="attachment")
        m.FormAttachment.objects.filter(pk=cls.form_attachment.pk).update(file_size=500)

        # Report and ReportVersion
        cls.report = m.Report.objects.create(project=cls.project, name="SaaS Report")
        cls.report_version = m.ReportVersion.objects.create(report=cls.report, name="v1")
        m.ReportVersion.objects.filter(pk=cls.report_version.pk).update(file_size=600)

        # BulkCreateUserFile
        cls.bulk_create_user_file = m.BulkCreateUserFile.objects.create(account=cls.account)
        m.BulkCreateUserFile.objects.filter(pk=cls.bulk_create_user_file.pk).update(file_size=700)

        # ImportGPKG
        cls.data_source = m.DataSource.objects.create(name="SaaS DataSource")
        cls.data_source.projects.add(cls.project)
        cls.import_gpkg = m.ImportGPKG.objects.create(data_source=cls.data_source)
        m.ImportGPKG.objects.filter(pk=cls.import_gpkg.pk).update(file_size=800)

        # APIImport
        cls.api_import = APIImport.objects.create(user=cls.user, json_body={})
        APIImport.objects.filter(pk=cls.api_import.pk).update(file_size=900)

    def test_calculate_methods(self):
        self.assertEqual(DiskSpaceAccountUsage.calculate_instances_size(self.account), 100)
        self.assertEqual(DiskSpaceAccountUsage.calculate_instances_files_size(self.account), 200)
        self.assertEqual(DiskSpaceAccountUsage.calculate_form_versions_files_size(self.account), 700)  # 300 + 400
        self.assertEqual(DiskSpaceAccountUsage.calculate_form_attachments_files_size(self.account), 500)
        self.assertEqual(DiskSpaceAccountUsage.calculate_reports_size(self.account), 600)
        self.assertEqual(DiskSpaceAccountUsage.calculate_bulk_create_user_csv_file_size(self.account), 700)
        self.assertEqual(DiskSpaceAccountUsage.calculate_import_gpkg_file_size(self.account), 800)
        self.assertEqual(DiskSpaceAccountUsage.calculate_api_import_file_size(self.account), 900)

    def test_compute_quota_value(self):
        self.assertEqual(DiskSpaceAccountUsage.compute_quota_value(self.account), 4500)
