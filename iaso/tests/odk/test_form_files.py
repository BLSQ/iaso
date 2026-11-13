import os
import tempfile

from django.core.files.base import ContentFile
from django.test import override_settings

from iaso import models as m
from iaso.api.submissions.common import form_csvs
from iaso.odk.form_files import local_copy
from iaso.test import TestCase
from iaso.tests.utils.query_profiler import QueryProfiler


class LocalCopyTestCase(TestCase):
    def setUp(self):
        super().setUp()
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        # not there yet: created on the first copy
        self.cache = os.path.join(directory.name, "odk_cli_cache")
        override = override_settings(ODK_CLI_CACHE_DIR=self.cache)
        override.enable()
        self.addCleanup(override.disable)
        self.form = m.Form.objects.create(name="Belgium census")

    def form_version(self, version_id, content):
        version = m.FormVersion(form=self.form, version_id=version_id)
        version.file.save("census.xml", ContentFile(content))
        self.addCleanup(version.file.delete, save=False)
        # as a request gets it: its file not read yet
        return m.FormVersion.objects.get(id=version.id)

    def read(self, path):
        with open(path, "rb") as file:
            return file.read()

    def test_read_from_the_storage_once(self):
        version = self.form_version("1", b"<h:html>census</h:html>")

        with QueryProfiler() as first:
            path = local_copy(version.file)
        with QueryProfiler() as again:
            same = local_copy(m.FormVersion.objects.get(id=version.id).file)

        self.assertEqual(self.read(path), b"<h:html>census</h:html>")
        self.assertTrue(path.startswith(self.cache) and path.endswith(".xml"), path)
        first.assertFilesOpened([version.file.name])
        self.assertEqual(same, path)
        again.assertFilesOpened([])
        self.assertEqual(os.listdir(self.cache), [os.path.basename(path)], "no partial copy left")

    def test_another_file_another_copy(self):
        census = self.form_version("1", b"<h:html>census</h:html>")
        # the storage never overwrites: the same name uploaded again is stored under another one
        census_v2 = self.form_version("2", b"<h:html>census v2</h:html>")
        self.assertNotEqual(census.file.name, census_v2.file.name)

        self.assertEqual(self.read(local_copy(census.file)), b"<h:html>census</h:html>")
        self.assertEqual(self.read(local_copy(census_v2.file)), b"<h:html>census v2</h:html>")

    def test_the_size_is_part_of_the_key(self):
        version = self.form_version("1", b"<h:html>census</h:html>")
        version.file_size = 23
        path = local_copy(version.file)

        # the same name for another content (a file removed then uploaded again under its name)
        version.file_size = 26
        other = local_copy(version.file)

        self.assertNotEqual(other, path)

    def test_the_forms_csv_attachments(self):
        """`pulldata()`'s files, by name: local copies too. Only the CSVs."""
        for name, content in (("districts.csv", b"code,name\nBXL,Brussels-Capital\n"), ("logo.png", b"\x89PNG")):
            attachment = m.FormAttachment(form=self.form, name=name, md5="0" * 32)
            attachment.file.save(name, ContentFile(content))
            self.addCleanup(attachment.file.delete, save=False)

        with QueryProfiler() as first:
            paths = form_csvs(self.form)
        with QueryProfiler() as again:
            self.assertEqual(form_csvs(self.form), paths)

        self.assertEqual(list(paths), ["districts.csv"])
        self.assertEqual(self.read(paths["districts.csv"]), b"code,name\nBXL,Brussels-Capital\n")
        first.assertFilesOpened([self.form.attachments.get(name="districts.csv").file.name])
        again.assertFilesOpened([])
