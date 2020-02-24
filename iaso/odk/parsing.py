import pathlib
import typing
from pyxform import create_survey_from_xls


class XMLForm:
    def __init__(self, xml_file_content: bytes, xml_file_name: str, *, settings: typing.Mapping[str, str]):
        self.file_content = xml_file_content
        self.file_name = xml_file_name
        self._settings = settings

    def __getitem__(self, item):
        return self._settings[item]

    def __contains__(self, item):
        return item in self._settings


def parse_xls_form(xls_file: typing.BinaryIO) -> XMLForm:
    """Converts an ODK xls form file to an ODK xml form file.

    Note: the pyxform conversion function works with file paths, and does not handle file-like objects.
    Instead of using low-level pyxform functions and structure, we use temporary files to be able to use
    the conversion functions as is.

    :param xls_file: a named file-like object (a persistent file or a django uploaded file will do)
    """

    survey = create_survey_from_xls(xls_file)
    # TODO: validation requires Java - disabling it for now, to discuss
    xml_file_content = survey.to_xml(validate=False)
    # TODO: generate versions if not exist, else validate > previous + validate uniqueness for same form
    xls_path = pathlib.Path(xls_file.name)
    xml_file_name = f'{xls_path.stem}.xml'  # TODO: add version in filename

    return XMLForm(xml_file_content.encode('utf-8'), xml_file_name, settings={
        'form_id': survey.id_string,
        'form_title': survey.title,
        'version': survey.version
    })
