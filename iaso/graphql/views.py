import json
import logging

from pathlib import Path

from ariadne import combine_multipart_data, format_error, graphql_sync
from ariadne.exceptions import HttpBadRequestError
from django.conf import settings
from django.db import OperationalError, connection, transaction
from django.http import FileResponse, HttpResponse, HttpResponseNotAllowed, JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from graphql import GraphQLError, GraphQLSyntaxError, parse
from psycopg2.errors import QueryCanceled
from rest_framework.exceptions import APIException
from rest_framework.request import Request
from rest_framework.settings import api_settings

from iaso.drf_spectacular_utils.permissions import HasAccountAndProfile

from .monitoring import OperationLog
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

#: required on a multipart request: a header a cross-site form can't send (see `_multipart_operation`)
PREFLIGHT_HEADER = "GraphQL-Preflight"

#: `GET /api/graphql/`: GraphiQL (`graphql/graphiql.html`), the "try it" of `/api/swagger-ui/` - queries run as the
#: logged-in user. What it opens without a `?query=` in its URL:
EXAMPLE_QUERY = """# The "Docs" panel (top left) lists every field, "Reference" (top right) explains them. Ctrl-Enter runs
# the query, as you.
query {
  orgUnits(filters: {validationStatus: VALID}, limit: 5) {
    items { id name orgUnitType { name } parent { name } }
    hasNextPage
  }
}
"""
#: relative to `/api/graphql/`: wherever the API is mounted
DOCS_URL = "docs/"
#: built by `npm run graphql-docs`, in the prod image's node stage
DOCS_PATH = Path(settings.BASE_DIR) / "hat" / "assets" / "graphql" / "docs.html"


def _parse_query(context, data):
    document = parse(data["query"], max_tokens=MAX_TOKENS)
    # parsed: what is about to run, logged before it runs
    operation_log = context["operation_log"]
    operation_log.describe(document)
    operation_log.start()
    return document


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


@csrf_exempt  # the REST API's `CsrfExemptSessionAuthentication` trade-off, narrowed: JSON bodies, or a preflight header
def graphql_view(request):
    try:
        _authenticate(request)
    except APIException as e:
        return JsonResponse({"errors": [{"message": str(e.detail)}]}, status=e.status_code)
    # same as `AuthenticationEnforcedPermission`: no anonymous request at all, introspection included
    if settings.AUTHENTICATION_ENFORCED and not request.user.is_authenticated:
        return JsonResponse({"errors": [{"message": "Authentication credentials were not provided."}]}, status=401)

    if request.method == "GET":
        return _for_account_users(
            request,
            lambda: render(request, "graphql/graphiql.html", {"example_query": EXAMPLE_QUERY, "docs_url": DOCS_URL}),
        )
    if request.method != "POST":
        return HttpResponseNotAllowed(["POST"])
    if request.content_type == "multipart/form-data":
        data = _multipart_operation(request)
        if isinstance(data, JsonResponse):
            return data
    elif request.content_type == "application/json":
        try:
            data = json.loads(request.body)
        except ValueError:
            return JsonResponse({"errors": [{"message": "Request body must be JSON"}]}, status=400)
    else:
        # a cross-site form can POST a JSON-looking body as `text/plain`, with the user's session cookie, without
        # the browser asking first. `application/json` needs a CORS preflight, and CORS here never allows credentials
        return _error("Content-Type must be application/json (or multipart/form-data for a file upload)", 415)

    operation_log = OperationLog(request, data if isinstance(data, dict) else {})
    status, result, response = 500, None, None
    try:
        with connection.execute_wrapper(operation_log.wrap_sql), transaction.atomic():
            with connection.cursor() as cursor:
                cursor.execute("SET LOCAL statement_timeout = %s", [STATEMENT_TIMEOUT_MS])
            success, result = graphql_sync(
                schema,
                data,
                context_value={"request": request, "operation_log": operation_log},
                query_parser=_parse_query,
                validation_rules=VALIDATION_RULES,
                error_formatter=_format_error,
                debug=settings.DEBUG,
                logger=ariadne_logger,
            )
        status = 200 if success else 400
        response = JsonResponse(result, status=status)
        return response
    finally:
        # also when it crashed: the `start` line has its `end`
        operation_log.end(status, result, len(response.content) if response is not None else 0)


def graphql_docs_view(request):
    """`GET /api/graphql/docs/`: the reference SpectaQL builds from the schema files (`docs/spectaql.yml`)."""
    if request.method != "GET":
        return HttpResponseNotAllowed(["GET"])
    try:
        _authenticate(request)
    except APIException as e:
        return JsonResponse({"errors": [{"message": str(e.detail)}]}, status=e.status_code)
    return _for_account_users(request, _docs)


def _docs():
    try:
        return FileResponse(open(DOCS_PATH, "rb"), content_type="text/html; charset=utf-8")
    except FileNotFoundError:
        return HttpResponse("The GraphQL reference isn't built: `npm run graphql-docs`.", status=404)


def _for_account_users(request, response):
    """Who can see `/api/swagger-ui/`."""
    if not HasAccountAndProfile().has_permission(request, None):
        return JsonResponse({"errors": [{"message": "Log in with an IASO account to explore the API."}]}, status=403)
    return response()


def _multipart_operation(request):
    """A GraphQL multipart request (https://github.com/jaydenseric/graphql-multipart-request-spec): the operation
    (`operations`) with its file variables set from the `map` of the file parts - or the error response.

    A cross-site form can POST `multipart/form-data` with the user's session cookie, without the browser asking
    first: the `GraphQL-Preflight` header (Apollo Server's approach) makes the browser ask, and CORS here never allows
    credentials."""
    if not request.headers.get(PREFLIGHT_HEADER):
        return _error(f"A multipart request (a file upload) needs a `{PREFLIGHT_HEADER}: 1` header", 400)
    try:
        operations = json.loads(request.POST["operations"])
        files_map = json.loads(request.POST["map"])
        data = combine_multipart_data(operations, files_map, request.FILES)
    except KeyError as missing:
        return _error(f"The multipart request has no {missing} part", 400)
    except (ValueError, HttpBadRequestError) as error:
        return _error(f"Invalid multipart request: {error}", 400)
    if not isinstance(data, dict):
        return _error("One operation per request", 400)
    return data


def _error(message: str, status: int) -> JsonResponse:
    return JsonResponse({"errors": [{"message": message}]}, status=status)
