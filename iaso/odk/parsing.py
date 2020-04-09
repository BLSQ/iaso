import pathlib
import typing
from pyxform import create_survey_from_xls, errors
from django.utils import timezone, dateparse


class ParsingError(Exception):
    pass


class XMLForm:
    def __init__(
        self,
        xml_file_content: bytes,
        xml_file_name: str,
        *,
        settings: typing.Mapping[str, str],
    ):
        self.file_content = xml_file_content
        self.file_name = xml_file_name
        self._settings = settings

    def __getitem__(self, item):
        return self._settings[item]

    def __contains__(self, item):
        return item in self._settings


def to_json_dict(form_version):

    if not form_version.xls_file:
        return None
    try:
        survey = create_survey_from_xls(form_version.xls_file.file)
        return survey.to_json_dict()
    except FileNotFoundError as e:
        print("Failed to form in xls", e)

    return None


def visit(node, questions_by_name):
    parent = node["type"] == "survey" or node["type"] == "group"
    if parent:
        for child in node["children"]:
            visit(child, questions_by_name)
    else:
        questions_by_name[node["name"]] = node


def to_questions_by_name(form_descriptor):
    questions_by_name = {}
    if not form_descriptor or len(form_descriptor) == 0:
        return questions_by_name
    visit(form_descriptor, questions_by_name)
    return questions_by_name


def parse_xls_form(
    xls_file: typing.BinaryIO, *, previous_version: str = None
) -> XMLForm:
    """Converts an ODK xls form file to an ODK xml form file.

    Note: the pyxform conversion function works with file paths, and does not handle file-like objects.
    Instead of using low-level pyxform functions and structure, we use temporary files to be able to use
    the conversion functions as is.

    :param xls_file: a named file-like object (a persistent file or a django uploaded file will do)
    :param previous_version: used to validate the version present in the excel file or to auto-generate it
    """

    try:
        survey = create_survey_from_xls(xls_file, default_name="data")
    except errors.PyXFormError as e:
        raise ParsingError(f"Invalid XLS file: {e}")

    if survey.version == "":
        survey.version = _generate_form_version(previous_version)

    if not survey.version.isnumeric() or len(survey.version) > 10:
        raise ParsingError(
            "Invalid XLS file: Invalid version (must be a string of 1-10 numbers)."
        )

    if (
        previous_version is not None
        and previous_version.isnumeric()
        and int(previous_version) >= int(survey.version)
    ):
        raise ParsingError(
            "Invalid XLS file: Parsed version should be greater than previous version."
        )

    xml_file_content = survey.to_xml(validate=False)
    xls_path = pathlib.Path(xls_file.name)
    xml_file_name = f"{xls_path.stem}.xml"

    return XMLForm(
        xml_file_content.encode("utf-8"),
        xml_file_name,
        settings={
            "form_id": survey.id_string,
            "form_title": survey.title,
            "version": survey.version,
        },
    )


def _generate_form_version(previous_version: typing.Optional[str]) -> str:
    """Generate a form version in the yyyymmddrr format.
    If a previous version is provided, and is also in the yyyymmddrr, it will be used to check if we should increment
    the revision part(rr) or create a new revision for the day

    :param previous_version: last saved version number in our system
    """

    today = timezone.now().date()
    if (
        previous_version is not None and len(previous_version) == 10
    ):  # previous version in yyyymmddrr format
        previous_version_date_string = (
            f"{previous_version[:4]}-{previous_version[4:6]}-{previous_version[6:8]}"
        )
        if (
            dateparse.parse_date(previous_version_date_string) == today
        ):  # previous version was created today
            if previous_version[8:] == "99":
                raise ParsingError("Invalid XLS file: Too many versions.")

            return str(int(previous_version) + 1)

    return f"{today.strftime('%Y%m%d')}01"
