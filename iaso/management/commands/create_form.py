from django.core.files import File
from django.core.management.base import BaseCommand

from iaso.models import Project, Form, FormVersion
from iaso.odk import parsing


class Command(BaseCommand):
    help = "Create a first form for initial usage of the application"

    def handle(self, *args, **options):
        projects = Project.objects.all()
        if len(projects) > 0:
            project = projects[0]
            form = Form(name="test", form_id="formid", device_field="deviceid")
            form.save()
            project.forms.set([form])
            project.save()
            with open("testdata/seed-data-command-cvs_survey.xls", "rb") as form_1_version_1_file:
                survey = parsing.parse_xls_form(form_1_version_1_file)
                form_version_1 = FormVersion.objects.create_for_form_and_survey(
                    form=form, survey=survey, xls_file=File(form_1_version_1_file)
                )
                form_version_1.version_id = "1"
                form_version_1.save()
            print("Form has been successfully created!")
        else:
            print("Please create a project before running this command...")
