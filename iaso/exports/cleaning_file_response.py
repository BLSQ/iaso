import os

from django.http import FileResponse


# Since we are on a hold python and django version
# cleaning the tmp file once served, seem to be the only way
class CleaningFileResponse(FileResponse):
    def __init__(self, path, *args, **kwargs):
        self._path = path
        self._file = open(path, "rb")
        super().__init__(self._file, *args, **kwargs)

    def close(self):
        try:
            super().close()
        finally:
            try:
                self._file.close()
            except Exception:
                pass
            try:
                os.remove(self._path)
            except FileNotFoundError:
                pass
