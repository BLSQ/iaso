"""In-process IASO API client: same Django user, no HTTP loopback, no stored tokens."""

from __future__ import annotations

from typing import Any
from urllib.parse import urlencode

from django.conf import settings
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient


class IasoError(Exception):
    pass


class IasoHTTPError(IasoError):
    def __init__(self, message: str, *, status_code: int = 500, payload: Any = None):
        super().__init__(message)
        self.status_code = status_code
        self.payload = payload


def _api_url(path: str) -> str:
    cleaned = (path or "").strip().lstrip("/")
    if cleaned.startswith("api/"):
        cleaned = cleaned[4:]
    url = "/api/" + cleaned
    if "?" not in url and not url.endswith("/"):
        url += "/"
    return url


def _decode_response(response) -> Any:
    if not getattr(response, "content", None):
        return None
    try:
        return response.json()
    except ValueError:
        text = response.content.decode("utf-8", errors="replace")
        return text[:2000]


def _raise_if_error(response, url: str) -> Any:
    payload = _decode_response(response)
    if response.status_code >= 400:
        message = f"{url} failed with status {response.status_code}."
        raise IasoHTTPError(message, status_code=response.status_code, payload=payload)
    return payload


class DjangoUserTransport:
    """DRF APIClient authenticated as the MCP user (no network, no extra tokens)."""

    token = None

    def __init__(self, user, *, request=None):
        self.user = user
        self.http_request = request
        self._api = APIClient()
        self._api.force_authenticate(user=user)
        self._api.force_login(user)

    @property
    def base_url(self) -> str:
        if self.http_request is not None:
            from iaso.mcp.oauth import get_base_url

            return get_base_url(self.http_request)
        domain = getattr(settings, "DNS_DOMAIN", "localhost:8081")
        scheme = "https" if getattr(settings, "SESSION_COOKIE_SECURE", False) else "http"
        return f"{scheme}://{domain}"

    def _build_url(self, path: str) -> str:
        return self.base_url.rstrip("/") + _api_url(path)

    def request(
        self,
        method: str,
        path: str,
        *,
        params: dict[str, Any] | None = None,
        json: Any = None,
    ) -> Any:
        url = _api_url(path)
        if params:
            url = url + ("&" if "?" in url else "?") + urlencode(params, doseq=True)
        verb = method.upper()
        if verb == "GET":
            response = self._api.get(url)
        elif verb == "DELETE":
            response = self._api.delete(url)
        elif verb == "POST":
            response = self._api.post(url, data=json, format="json")
        elif verb == "PATCH":
            response = self._api.patch(url, data=json, format="json")
        elif verb == "PUT":
            response = self._api.put(url, data=json, format="json")
        else:
            message = f"Unsupported method {method}."
            raise IasoError(message)
        return _raise_if_error(response, url)

    def post_multipart(
        self,
        path: str,
        *,
        data: dict[str, Any] | None = None,
        files: dict[str, Any] | None = None,
        params: dict[str, Any] | None = None,
    ) -> Any:
        url = _api_url(path)
        if params:
            url = url + ("&" if "?" in url else "?") + urlencode(params, doseq=True)
        payload = dict(data or {})
        for field, spec in (files or {}).items():
            payload[field] = _as_uploaded(spec)
        response = self._api.post(url, data=payload, format="multipart")
        return _raise_if_error(response, url)

    def post_root(
        self,
        path: str,
        *,
        files: dict[str, Any] | None = None,
        params: dict[str, Any] | None = None,
        data: dict[str, Any] | None = None,
    ) -> tuple[int, Any]:
        url = "/" + path.lstrip("/")
        if params:
            url = url + ("&" if "?" in url else "?") + urlencode(params, doseq=True)
        payload = dict(data or {})
        for field, spec in (files or {}).items():
            payload[field] = _as_uploaded(spec)
        response = self._api.post(url, data=payload)
        return response.status_code, _decode_response(response)


def _as_uploaded(spec: Any) -> Any:
    if isinstance(spec, (tuple, list)):
        name = spec[0]
        content = spec[1]
        content_type = spec[2] if len(spec) > 2 else "application/octet-stream"
        if isinstance(content, str):
            content = content.encode("utf-8")
        return SimpleUploadedFile(name, content, content_type=content_type)
    return spec


class IasoClient:
    def __init__(self, user, *, request=None):
        self.user = user
        self.transport = DjangoUserTransport(user, request=request)

    @classmethod
    def for_user(cls, user, *, request=None) -> IasoClient:
        return cls(user, request=request)

    def _list_page(self, path: str, page: int, limit: int, **filters: Any) -> dict[str, Any]:
        params = {key: value for key, value in filters.items() if value is not None}
        params["page"] = page
        params["limit"] = limit
        return self.transport.request("GET", path, params=params)

    def org_units_list_page(self, page: int = 1, limit: int = 10, **filters: Any) -> dict[str, Any]:
        return self._list_page("orgunits/", page, limit, **filters)

    def org_units_retrieve(self, org_unit_id: int) -> dict[str, Any]:
        return self.transport.request("GET", f"orgunits/{org_unit_id}/")

    def org_unit_types_list_page(self, page: int = 1, limit: int = 10, **filters: Any) -> dict[str, Any]:
        return self._list_page("orgunittypes/", page, limit, **filters)

    def org_unit_types_retrieve(self, org_unit_type_id: int) -> dict[str, Any]:
        return self.transport.request("GET", f"orgunittypes/{org_unit_type_id}/")

    def org_unit_types_hierarchy(self, org_unit_type_id: int) -> dict[str, Any]:
        return self.transport.request("GET", f"v2/orgunittypes/{org_unit_type_id}/hierarchy/")

    def forms_list_page(self, page: int = 1, limit: int = 10, **filters: Any) -> dict[str, Any]:
        return self._list_page("forms/", page, limit, **filters)

    def forms_retrieve(self, form_id: int) -> dict[str, Any]:
        return self.transport.request("GET", f"forms/{form_id}/")

    def form_versions_list_page(self, page: int = 1, limit: int = 10, **filters: Any) -> dict[str, Any]:
        return self._list_page("formversions/", page, limit, **filters)

    def form_versions_retrieve(self, form_version_id: int) -> dict[str, Any]:
        return self.transport.request("GET", f"formversions/{form_version_id}/")

    def instances_list_page(self, page: int = 1, limit: int = 10, **filters: Any) -> dict[str, Any]:
        return self._list_page("instances/", page, limit, **filters)

    def instances_retrieve(self, instance_id: int) -> dict[str, Any]:
        return self.transport.request("GET", f"instances/{instance_id}/")

    def instance_files_list_page(self, page: int = 1, limit: int = 10, **filters: Any) -> dict[str, Any]:
        return self._list_page("instances/", page, limit, **filters)

    def instance_files_count(self, **filters: Any) -> dict[str, Any]:
        page = self.instances_list_page(page=1, limit=1, **filters)
        return {"count": page.get("count") or 0}
