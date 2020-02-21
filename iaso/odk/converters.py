import pathlib
import tempfile
import typing
from pyxform.xls2xform import xls2xform_convert


def xls_form_to_xform(xls_file: typing.BinaryIO, xls_filename: str) -> typing.Tuple[typing.BinaryIO, str]:
    """Converts an ODK xls form file to an ODK xml form file.

    Note: the pyxform conversion function works with file paths, and does not handle file-like objects.
    Instead of using low-level pyxform functions and structure, we use temporary files to be able to use
    the conversion function as is.

    :param xls_file: any file-like object
    :param xls_filename: needed to find the file extension and determine the xml file name
    :todo write tests
    """

    xml_tf = tempfile.NamedTemporaryFile(suffix='xml')
    xls_path = pathlib.Path(xls_filename)

    with tempfile.NamedTemporaryFile(suffix=xls_path.suffix) as xls_tf:
        xls_tf.write(xls_file.read())
        # TODO: validation requires Java - disabling it for now, to discuss
        xls2xform_convert(xls_tf.name, xml_tf.name, validate=False)

    return xml_tf, f'{xls_path.stem}.xml'
