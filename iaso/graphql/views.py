import json
import logging

from ariadne import format_error, graphql_sync
from ariadne.explorer import ExplorerGraphiQL
from django.conf import settings
from django.db import OperationalError, connection, transaction
from django.http import HttpResponse, HttpResponseNotAllowed, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from graphql import GraphQLError, GraphQLSyntaxError, parse
from psycopg2.errors import QueryCanceled
from rest_framework.exceptions import APIException
from rest_framework.request import Request
from rest_framework.settings import api_settings

from .schema import schema
from .validation import MAX_TOKENS, VALIDATION_RULES


logger = logging.getLogger(__name__)
#: handed to Ariadne, which logs every error with its traceback - a bad `limit` included. The unexpected ones are
#: logged by `_format_error` instead.
ariadne_logger = logging.getLogger(f"{__name__}.ariadne")
ariadne_logger.addHandler(logging.NullHandler())
ariadne_logger.propagate = False

#: every SQL statement of a request, a safety net behind the query shape limits
STATEMENT_TIMEOUT_MS = 10_000


def _parse_query(context, data):
    return parse(data["query"], max_tokens=MAX_TOKENS)


def _format_error(error: GraphQLError, debug: bool = False) -> dict:
    """Errors raised on purpose (`GraphQLError`: validation, bad filter values) keep their message; anything
    else is logged and reported without its internals (an SQL error message can quote the query).

    Every error carries an `extensions.code` (Apollo's convention, which clients and tools such as schemathesis
    read): whether the request was refused - `GRAPHQL_PARSE_FAILED`, `GRAPHQL_VALIDATION_FAILED`, `BAD_USER_INPUT`
    (a resolver's own check), `UNAUTHENTICATED`, `FORBIDDEN` - or failed: `QUERY_TIMEOUT`,
    `INTERNAL_SERVER_ERROR`."""
    original = error.original_error
    if original is None:
        code = "GRAPHQL_PARSE_FAILED" if isinstance(error, GraphQLSyntaxError) else "GRAPHQL_VALIDATION_FAILED"
        return _with_code(error, code, debug)
    if isinstance(original, GraphQLError):
        return _with_code(error, (original.extensions or {}).get("code", "BAD_USER_INPUT"), debug)
    if isinstance(original, OperationalError) and isinstance(original.__cause__, QueryCanceled):
        message = f"Query cancelled after {STATEMENT_TIMEOUT_MS // 1000}s: narrow the filters or the selection"
        code = "QUERY_TIMEOUT"
    else:
        logger.error("GraphQL resolver error", exc_info=original)
        message = "Internal server error"
        code = "INTERNAL_SERVER_ERROR"
    return _with_code(GraphQLError(message, error.nodes, path=error.path), code, debug)


def _with_code(error: GraphQLError, code: str, debug: bool) -> dict:
    formatted = format_error(error, debug)
    formatted["extensions"] = {**(formatted.get("extensions") or {}), "code": code}
    return formatted


def _authenticate(request):
    """Same DRF authentication classes as the REST API (JWT, CSRF-exempt session, ...): `request.user` is what an
    `/api/...` view would see."""
    drf_request = Request(request, authenticators=[auth() for auth in api_settings.DEFAULT_AUTHENTICATION_CLASSES])
    request.user = drf_request.user


@csrf_exempt  # no mutations: the same trade-off as the REST API's `CsrfExemptSessionAuthentication`
def graphql_view(request):
    try:
        _authenticate(request)
    except APIException as e:
        return JsonResponse({"errors": [{"message": str(e.detail)}]}, status=e.status_code)
    # same as `AuthenticationEnforcedPermission`: no anonymous request at all, introspection included
    if settings.AUTHENTICATION_ENFORCED and not request.user.is_authenticated:
        return JsonResponse({"errors": [{"message": "Authentication credentials were not provided."}]}, status=401)

    if request.method == "GET" and settings.DEBUG:
        return HttpResponse(ExplorerGraphiQL().html(None))
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])

    try:
        data = json.loads(request.body)
    except ValueError:
        return JsonResponse({"errors": [{"message": "Request body must be JSON"}]}, status=400)

    with transaction.atomic():
        with connection.cursor() as cursor:
            cursor.execute("SET LOCAL statement_timeout = %s", [STATEMENT_TIMEOUT_MS])
        success, result = graphql_sync(
            schema,
            data,
            context_value={"request": request},
            query_parser=_parse_query,
            validation_rules=VALIDATION_RULES,
            error_formatter=_format_error,
            debug=settings.DEBUG,
            logger=ariadne_logger,
        )
    return JsonResponse(result, status=200 if success else 400)
