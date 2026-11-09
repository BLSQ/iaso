"""Files referenced by the API responses.

The mobile app downloads some files on initial sync: form versions (XLSForm XML), form attachments
(with a manifest per form) and reports. The export downloads them into the zip, and rewrites their
URLs in the API responses to their path in the zip, so the app can find them locally.
"""

import re

from dataclasses import dataclass
from functools import partial
from typing import Any, Callable, Optional
from urllib.parse import urlparse


MANIFEST_DOWNLOAD_URL_REGEX = r"(?<=<downloadUrl>)(.*?)(?=</downloadUrl>)"


@dataclass(frozen=True)
class AssetFile:
    # Where the file goes in the zip
    path: str
    # Where to download it from: a storage URL, or an API path when `from_api`
    url: str
    # Served by the API (authenticated)
    from_api: bool = False
    # Callable applied to the downloaded content before it's saved
    rewrite: Optional[Callable[[bytes], bytes]] = None


def form_version_files(payload: Any, app_id: str) -> list[AssetFile]:
    files = []
    for form_version in payload["form_versions"]:
        path = f"forms/{filename_from_url(form_version['file'])}"
        files.append(AssetFile(path=path, url=form_version["file"]))
        form_version["file"] = path
    return files


def report_files(payload: Any, app_id: str) -> list[AssetFile]:
    files = []
    for report in payload:
        path = f"reports/{filename_from_url(report['url'])}"
        files.append(AssetFile(path=path, url=report["url"]))
        report["url"] = path
    return files


def form_attachment_files(payload: Any, app_id: str) -> list[AssetFile]:
    files = []
    forms_with_manifest = set()
    for attachment in payload["results"]:
        form_id = attachment["form_id"]
        path = form_attachment_path(form_id, attachment["file"])
        files.append(AssetFile(path=path, url=attachment["file"]))
        attachment["file"] = path

        # One manifest per form, listing all its attachments.
        if form_id not in forms_with_manifest:
            files.append(
                AssetFile(
                    path=f"formattachments/{form_id}/manifest.xml",
                    url=f"/api/forms/{form_id}/manifest/?app_id={app_id}",
                    from_api=True,
                    rewrite=partial(rewrite_manifest, form_id),
                )
            )
            forms_with_manifest.add(form_id)
    return files


def filename_from_url(url: str) -> str:
    """Determine the file name in the zip based on the URL.

    Matches the rewritten manifest `downloadUrl`s.
    """
    return urlparse(url).path.split("/")[-1]


def form_attachment_path(form_id, url: str) -> str:
    """Path of a form attachment in the zip."""
    return f"formattachments/{form_id}/{filename_from_url(url)}"


def rewrite_manifest(form_id, manifest: bytes) -> bytes:
    """Points each `downloadUrl` of a form manifest to its attachment in the zip."""
    return re.sub(
        MANIFEST_DOWNLOAD_URL_REGEX,
        lambda match: form_attachment_path(form_id, match.group()),
        manifest.decode("utf-8"),
    ).encode("utf-8")
