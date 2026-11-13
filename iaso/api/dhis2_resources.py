import logging

from time import process_time

import requests

from dhis2 import Api
from dhis2.exceptions import RequestException as Dhis2RequestException
from drf_spectacular.utils import extend_schema
from rest_framework import permissions, status, viewsets
from rest_framework.response import Response

from iaso.models import DataSource


logger = logging.getLogger(__name__)

DHIS2_TIMEOUT_SECONDS = 30


class Dhis2ErrorCode:
    NO_CREDENTIALS = "dhis2_no_credentials"
    INVALID_CREDENTIALS = "dhis2_invalid_credentials"
    UNAVAILABLE = "dhis2_unavailable"


def _dhis2_error_response(code: str, message: str) -> Response:
    return Response({"error": message, "code": code}, status=status.HTTP_409_CONFLICT)


@extend_schema(tags=["DHIS2", "Data sources"])
class Dhis2ViewSet(viewsets.ViewSet):
    """DHIS2 datasources API

    This API is restricted to authenticated users (no specific permission check)

    GET /api/datasources/dataElements/
    GET /api/datasources/dataSets/
    GET /api/datasources/programs/
    """

    resource: str
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request, datasource_id, format="json"):
        sources = DataSource.objects.all()
        profile = request.user.iaso_profile
        data_source = sources.filter(projects__account=profile.account, id=datasource_id).first()

        if data_source is None:
            return Response({"error": "Data source not available"}, status=status.HTTP_404_NOT_FOUND)

        if data_source.credentials is None:
            return _dhis2_error_response(Dhis2ErrorCode.NO_CREDENTIALS, "No credentials configured")

        credentials = data_source.credentials

        t1_start = process_time()
        api = Api(credentials.url, credentials.login, credentials.password)
        params = {
            "fields": request.GET.get("fields", "id,displayName"),
            "pageSize": request.GET.get("pageSize", 50),
            "filter": request.GET.get("filter", None),
        }
        try:
            resp = api.get(self.resource, params=params, timeout=DHIS2_TIMEOUT_SECONDS).json()
        except Dhis2RequestException as err:
            logger.warning("DHIS2 %s call failed for data source %s: %s", self.resource, data_source.id, err.code)
            if err.code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN):
                return _dhis2_error_response(Dhis2ErrorCode.INVALID_CREDENTIALS, "DHIS2 credentials are not valid")
            return _dhis2_error_response(Dhis2ErrorCode.UNAVAILABLE, "DHIS2 is not available")
        except requests.RequestException as err:
            # connection error, timeout, or a non-JSON answer (e.g. a proxy error page)
            logger.warning(
                "DHIS2 %s call failed for data source %s: %s", self.resource, data_source.id, type(err).__name__
            )
            return _dhis2_error_response(Dhis2ErrorCode.UNAVAILABLE, "DHIS2 is not available")
        t1_stop = process_time()

        if "pager" in resp:
            if "nextPage" in resp["pager"]:
                del resp["pager"]["nextPage"]

        resp["stats"] = {"elapsedTimeMs": (t1_stop - t1_start) * 1000}
        return Response(resp)


class DataElementsViewSet(Dhis2ViewSet):
    resource = "dataElements"


class DataSetsViewSet(Dhis2ViewSet):
    resource = "dataSets"


class ProgramsViewSet(Dhis2ViewSet):
    resource = "programs"


class RelationshipTypesSet(Dhis2ViewSet):
    resource = "relationshipTypes"


DHIS2_VIEWSETS = (DataElementsViewSet, DataSetsViewSet, ProgramsViewSet, RelationshipTypesSet)
