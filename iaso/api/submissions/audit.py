"""Every `POST /api/submissions/` is kept in an `APIImport`, refused or not: what was sent, and why it was refused, so
support can see it and the client can point at it (`import_id`). Written outside the request's transaction, so a
refusal's rollback keeps it.

The files sent are described (name, size, type, sha256), not kept: they may be large or hold personal data."""

import hashlib
import json

from typing import Any, Optional

from django.core.files.uploadedfile import UploadedFile
from rest_framework.request import Request
from rest_framework.response import Response

from hat.api_import.models import APIImport
from iaso.api.common import REQUEST_HEADER_INFO_KEYS
from iaso.models import Project


IMPORT_TYPE = "submissionsJson"


def start_audit(request: Request, data: Any, files: dict[str, UploadedFile]) -> APIImport:
    body = data if isinstance(data, dict) else {"body": data}
    if files:
        body = {**body, "attachments": [_describe(name, file) for name, file in files.items()]}
    return APIImport.objects.create(
        user=request.user,
        import_type=IMPORT_TYPE,
        json_body=body,
        headers={key: request.META.get(key) for key in REQUEST_HEADER_INFO_KEYS},
        # the import lists show an account the rows of its projects' app ids: the user's first project until a
        # submission's own project is known
        app_id=_default_app_id(request.user),
    )


def finish_audit(api_import: APIImport, response: Response, project: Optional[Project]) -> None:
    api_import.has_problem = response.status_code >= 400
    api_import.exception = json.dumps(response.data) if api_import.has_problem else ""
    if project is not None:
        api_import.app_id = project.app_id
    api_import.save(update_fields=["has_problem", "exception", "app_id"])


def _default_app_id(user) -> str:
    project = (
        Project.objects.filter_on_user_projects(user)
        .filter(account=user.iaso_profile.account)
        .order_by("id")
        .only("app_id")
        .first()
    )
    return project.app_id if project else ""


def _describe(name: str, file: UploadedFile) -> dict[str, Any]:
    digest = hashlib.sha256()
    for chunk in file.chunks():
        digest.update(chunk)
    file.seek(0)
    return {"name": name, "size": file.size, "content_type": file.content_type, "sha256": digest.hexdigest()}
