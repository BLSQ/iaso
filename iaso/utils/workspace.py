from typing import Optional

from django.http import Http404

from iaso.models import Workspace


ACTIVE_WORKSPACE_REQUEST_ATTRIBUTE = "_iaso_active_workspace"


def find_active_workspace(request) -> Optional[Workspace]:
    """Workspace the request acts in, if its account has one. Until users can hold several workspaces, it is their account's workspace."""
    cached_workspace = getattr(request, ACTIVE_WORKSPACE_REQUEST_ATTRIBUTE, None)
    if cached_workspace is not None:
        return cached_workspace

    account = _get_request_account(request)
    workspace = Workspace.objects.filter(account=account).order_by("id").first() if account else None
    if workspace is not None:
        setattr(request, ACTIVE_WORKSPACE_REQUEST_ATTRIBUTE, workspace)
    return workspace


def get_active_workspace(request) -> Workspace:
    workspace = find_active_workspace(request)
    if workspace is None:
        raise Http404("No workspace found for this account.")
    return workspace


def _get_request_account(request):
    profile = getattr(request.user, "iaso_profile", None)
    return profile.account if profile else None
