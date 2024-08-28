import mimetypes

from django.core.files.storage import default_storage


def get_file_type(file):
    if file:
        file_path = default_storage.path(file.name)
        mime_type, _ = mimetypes.guess_type(file_path)
        return mime_type
    return None
