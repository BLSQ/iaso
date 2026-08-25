import gzip
import re

from io import BytesIO

from django.core.files.base import ContentFile
from storages.backends.azure_storage import AzureStorage  # type: ignore
from storages.backends.s3boto3 import S3Boto3Storage  # type: ignore


class StaticStorage(S3Boto3Storage):
    location = "iasostatics"
    default_acl = "public-read"


# Azure Blob Storage never compresses responses on the fly (unlike S3 behind CloudFront),
# so without this static assets are served uncompressed and webpack bundles can be several MB.
COMPRESSIBLE_EXTENSIONS = (".js", ".css", ".svg", ".json", ".txt", ".xml", ".map")

# webpack.prod.js names bundles/fonts/videos with a contenthash (e.g. "common-0a9eef66a245a98d5295.js"),
# so those filenames change whenever the content does and can be cached forever. Anything else
# (e.g. Django admin's static files) keeps a fixed name across deploys and can't be cached that long.
_HASHED_ASSET_RE = re.compile(r"[.-][0-9a-f]{8,}\.[^./]+$")


class AzureStaticStorage(AzureStorage):
    azure_container = "iaso"
    location = "static"
    expiration_secs = None
    default_acl = "public-read"

    def _is_compressible(self, name):
        return name.lower().endswith(COMPRESSIBLE_EXTENSIONS)

    def _save(self, name, content):
        # get_object_parameters() below sets Content-Encoding: gzip based on the same
        # check, so the two can never disagree about whether `content` was compressed.
        if self._is_compressible(name):
            content.seek(0)
            buffer = BytesIO()
            with gzip.GzipFile(filename="", mode="wb", fileobj=buffer, mtime=0) as gzip_file:
                gzip_file.write(content.read())
            content = ContentFile(buffer.getvalue())
        return super()._save(name, content)

    def get_object_parameters(self, name):
        params = super().get_object_parameters(name).copy()
        if self._is_compressible(name):
            params["content_encoding"] = "gzip"
        if _HASHED_ASSET_RE.search(name):
            params["cache_control"] = "public, max-age=31536000, immutable"
        else:
            params["cache_control"] = "public, max-age=3600"
        return params


class AzureMediaStorage(AzureStorage):
    azure_container = "iaso"
    location = "media"
    expiration_secs = None
