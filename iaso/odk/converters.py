import pathlib
import tempfile
import typing
from pyxform import builder, xls2json


class XMLForm:
    def __init__(self, xml_file_content: bytes, xml_file_name: str, *, settings: typing.Mapping[str, str]):
        self.file_content = xml_file_content
        self.file_name = xml_file_name
        self._settings = settings

    def __getitem__(self, item):
        return self._settings[item]

    def __contains__(self, item):
        return item in self._settings


def parse_xls_form(xls_file: typing.BinaryIO, xls_filename: str) -> XMLForm:
    """Converts an ODK xls form file to an ODK xml form file.

    Note: the pyxform conversion function works with file paths, and does not handle file-like objects.
    Instead of using low-level pyxform functions and structure, we use temporary files to be able to use
    the conversion functions as is.

    :param xls_file: any file-like object
    :param xls_filename: needed to find the file extension and determine the xml file name
    :todo write tests
    """

    with tempfile.NamedTemporaryFile(suffix='xml') as xml_tf:
        xls_path = pathlib.Path(xls_filename)

        with tempfile.NamedTemporaryFile(suffix=xls_path.suffix) as xls_tf:
            xls_tf.write(xls_file.read())
            warnings = []
            json_survey = xls2json.parse_file_to_json(xls_tf.name, warnings=warnings)
            survey = builder.create_survey_element_from_dict(json_survey)
            survey.print_xform_to_file(
                xml_tf.name,
                validate=False,  # TODO: validation requires Java - disabling it for now, to discuss
                warnings=warnings,
            )

        xml_file_content = xml_tf.read()
        xml_file_name = f'{xls_path.stem}.xml'

    return XMLForm(xml_file_content, xml_file_name, settings={
        'form_id': survey.id_string,
        'form_title': survey.title,
        'version': survey.version
    })
