import mimetypes


def get_file_type(file):
    if file:
        mime_type, _ = mimetypes.guess_type(file.name)
        return mime_type
    return None
