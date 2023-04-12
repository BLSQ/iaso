import logging

from django.db import migrations

from iaso.models.forms import _reformat_questions
from iaso.odk import parsing


def questions_by_path(form_version):
    return parsing.to_questions_by_path(get_or_save_form_descriptor(form_version))


def get_or_save_form_descriptor(form_version):
    if form_version.form_descriptor:
        json_survey = form_version.form_descriptor
    elif form_version.xls_file:
        json_survey = parsing.to_json_dict(form_version)
        form_version.form_descriptor = json_survey
        form_version.save()
    else:
        json_survey = {}
    return json_survey


class Migration(migrations.Migration):
    def data_migration(apps, schema_editor):
        FormVersion = apps.get_model("iaso", "FormVersion")
        versions = FormVersion.objects.filter(possible_fields__isnull=True)
        for version in versions:
            questions = questions_by_path(form_version=version)
            version.possible_fields = _reformat_questions(questions)
            version.save()

    def reverse(apps, schema_editor):
        FormVersion = apps.get_model("iaso", "FormVersion")
        FormVersion.objects.update(possible_fields=None)

    dependencies = [
        ("iaso", "0198_formversion_possible_fields"),
    ]

    operations = [migrations.RunPython(data_migration, reverse)]
