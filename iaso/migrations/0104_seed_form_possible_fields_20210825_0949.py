from django.db import migrations

from iaso.models.forms import _reformat_questions
from iaso.odk import parsing


## CANNOT USE method function on model and that's fucking annoying


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


def update_possible_fields(self: "iaso.models.Form"):
    """Keep accumulated list of all the flat fields that were present at some point in a version of the form.
    This is used to build a table view of the form answers without having to parse the xml files

    This need to be called when a new form version is added
    """
    # proceed from the oldest to the newest so we take newest labels
    all_questions = {}
    for form_version in self.form_versions.order_by("created_at"):
        # proceed from the oldest to the newest so we take newest labels
        questions = parsing.to_questions_by_name(get_or_save_form_descriptor(form_version))
        if isinstance(questions, dict):
            all_questions.update(questions)
    self.possible_fields = _reformat_questions(all_questions)


def seed_form_possible_fields(apps, schema_editor):
    Form = apps.get_model("iaso", "Form")
    for form in Form.objects.all():
        update_possible_fields(form)
        form.save()


class Migration(migrations.Migration):
    dependencies = [
        ("iaso", "0103_auto_20210825_0945"),
    ]

    operations = [
        migrations.RunPython(seed_form_possible_fields, migrations.RunPython.noop),
    ]
