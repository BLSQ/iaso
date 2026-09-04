from __future__ import annotations

import logging

from pathlib import Path

from django.conf import settings
from django.contrib.staticfiles.storage import staticfiles_storage
from django.http import FileResponse, Http404, HttpRequest, HttpResponse, JsonResponse
from django.shortcuts import redirect
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from django.views.decorators.http import require_GET

from iaso.mcp import server as _mcp_server  # noqa: F401 — register tools
from iaso.mcp.oauth import get_base_url
from iaso.mcp.protocol import handle_jsonrpc, tools_catalog
from iaso.mcp.session import public_whoami_fields, set_current_request


logger = logging.getLogger(__name__)

_FRONTEND_DIST = Path(__file__).resolve().parent / "frontend" / "dist"


def _www_authenticate(request: HttpRequest) -> str:
    metadata = f"{get_base_url(request)}/.well-known/oauth-protected-resource"
    return f'Bearer resource_metadata="{metadata}"'


def _has_bearer(request: HttpRequest) -> bool:
    raw = request.META.get("HTTP_AUTHORIZATION") or request.headers.get("Authorization") or ""
    return raw.lower().startswith("bearer ")


def _wants_html(request: HttpRequest) -> bool:
    """Browsers send text/html. MCP clients send JSON / event-stream (OpenHEXA split)."""
    accept = (request.headers.get("Accept") or "").lower()
    return "text/html" in accept


def tools_json(request: HttpRequest) -> JsonResponse:
    return JsonResponse(tools_catalog())


@require_GET
@ensure_csrf_cookie
def me(request: HttpRequest) -> JsonResponse:
    if not request.user.is_authenticated:
        return JsonResponse({"ok": False, "error": "not_authenticated"}, status=401)
    return JsonResponse(public_whoami_fields(request.user, request))


@csrf_exempt
def mcp_endpoint(request: HttpRequest) -> HttpResponse:
    """JSON-RPC MCP. Bearer OAuth only — session cookies are not accepted here.

    GET is content-negotiated like OpenHEXA: browsers (Accept: text/html) get
    the catalog UI; MCP clients get the tools JSON catalog.
    """
    if request.method == "GET":
        if _wants_html(request):
            return spa(request)
        return tools_json(request)
    if request.method == "DELETE":
        return HttpResponse(status=200)
    if request.method != "POST":
        return HttpResponse(status=405)

    if not _has_bearer(request) or not request.user.is_authenticated:
        response = JsonResponse(
            {
                "error": "unauthorized",
                "error_description": "Bearer token required. Complete OAuth (Connect / /mcp auth).",
            },
            status=401,
        )
        response["WWW-Authenticate"] = _www_authenticate(request)
        return response

    set_current_request(request)
    result = handle_jsonrpc(request.body, request.user)
    if result is None:
        return HttpResponse(status=204)
    return JsonResponse(result)


def spa(request: HttpRequest, rest: str = "") -> HttpResponse:
    index = _FRONTEND_DIST / "index.html"
    if index.is_file():
        return HttpResponse(index.read_text(encoding="utf-8"), content_type="text/html")
    if settings.DEBUG:
        return redirect("http://127.0.0.1:5173/mcp/app/")
    return HttpResponse("MCP frontend not built. Run npm run build in iaso/mcp/frontend.", status=503)


def frontend_asset(request: HttpRequest, path: str) -> FileResponse:
    root = (_FRONTEND_DIST / "assets").resolve()
    target = (root / path).resolve()
    if not str(target).startswith(str(root)) or not target.is_file():
        raise Http404()
    return FileResponse(target.open("rb"))


def frontend_mark(request: HttpRequest) -> FileResponse:
    try:
        return FileResponse(staticfiles_storage.open("mcp/iaso-mark.png"), content_type="image/png")
    except Exception:
        target = Path(__file__).resolve().parent / "static" / "mcp" / "iaso-mark.png"
        if not target.is_file():
            raise Http404()
        return FileResponse(target.open("rb"), content_type="image/png")
