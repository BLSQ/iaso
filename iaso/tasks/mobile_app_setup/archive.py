import json
import zipfile

from typing import IO, Any, Union


class ZipArchive:
    """Writes data directly into a compressed zip file, without intermediate files on disk."""

    def __init__(self, file: Union[str, IO[bytes]]):
        """`file`: a path, or a binary file-like object."""
        self._zip_file = zipfile.ZipFile(file, "w", zipfile.ZIP_DEFLATED)

    def write_json(self, name: str, data: Any):
        self._zip_file.writestr(name, json.dumps(data))

    def write_bytes(self, name: str, data: bytes):
        self._zip_file.writestr(name, data)

    def close(self):
        self._zip_file.close()

    def __enter__(self) -> "ZipArchive":
        return self

    def __exit__(self, *exc_info):
        self.close()
        return False
