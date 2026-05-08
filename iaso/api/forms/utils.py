from xml.sax.saxutils import escape

from django.http import HttpResponse
from rest_framework import status
from rest_framework.request import Request

from iaso.api.enketo import public_url_for_enketo
from iaso.models import Form, FormAttachment


def generate_manifest_for_form(form: Form, request: Request) -> HttpResponse:
    attachments = form.attachments.all()
    media_files = []
    for attachment in attachments:
        attachment_file_url: str = attachment.file.url
        if not attachment_file_url.startswith("http"):
            # Needed for local dev
            attachment_file_url = public_url_for_enketo(request, attachment_file_url)
        media_files.append(generate_manifest_media_file(attachment, attachment_file_url))

    manifest = generate_manifest_structure(media_files)
    return HttpResponse(
        status=status.HTTP_200_OK,
        content_type="text/xml",
        headers={
            "X-OpenRosa-Version": "1.0",
        },
        content=manifest,
    )


def generate_manifest_media_file(attachment: FormAttachment, url: str) -> str:
    return f"""<mediaFile>
        <filename>{escape(attachment.name)}</filename>
        <hash>md5:{attachment.md5}</hash>
        <downloadUrl>{escape(url)}</downloadUrl>
    </mediaFile>"""


def generate_manifest_structure(content: list[str]) -> str:
    nl = "\n"  # Backslashes are not allowed in f-string ¯\_(ツ)_/¯
    return (
        f"""<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://openrosa.org/xforms/xformsManifest">
    {nl.join(content)}
</manifest>""",
    )
