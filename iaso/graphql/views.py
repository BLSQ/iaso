from django.conf import settings
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.exceptions import APIException
from rest_framework.request import Request
from rest_framework.settings import api_settings
from strawberry.django.views import GraphQLView

from iaso.graphql.schema import schema


@method_decorator(csrf_exempt, name="dispatch")
class IasoGraphQLView(GraphQLView):
    """Authenticates like the REST API: the same DRF authentication classes (JWT, CSRF-exempt session, ...)
    run before the query, so `request.user` is what a `/api/...` view would see.

    The schema has no mutations (and strawberry never runs one over GET anyway), so skipping Django's CSRF
    check is the same trade-off as the REST API's `CsrfExemptSessionAuthentication`."""

    allow_queries_via_get = True

    def dispatch(self, request, *args, **kwargs):
        drf_request = Request(request, authenticators=[auth() for auth in api_settings.DEFAULT_AUTHENTICATION_CLASSES])
        try:
            request.user = drf_request.user
        except APIException as e:
            return JsonResponse({"errors": [{"message": str(e.detail)}]}, status=e.status_code)
        # same as `AuthenticationEnforcedPermission`: no anonymous request at all, introspection included
        if settings.AUTHENTICATION_ENFORCED and not request.user.is_authenticated:
            return JsonResponse({"errors": [{"message": "Authentication credentials were not provided."}]}, status=401)
        return super().dispatch(request, *args, **kwargs)


def graphql_view():
    return IasoGraphQLView.as_view(schema=schema, graphql_ide="graphiql" if settings.DEBUG else None)
