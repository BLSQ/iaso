from time import process_time

from dhis2 import Api
from rest_framework import status, permissions
from rest_framework import viewsets
from rest_framework.response import Response

from iaso.models import DataSource


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
            return Response({"error": "No credentials configured"}, status=status.HTTP_401_UNAUTHORIZED)

        credentials = data_source.credentials

        t1_start = process_time()
        api = Api(credentials.url, credentials.login, credentials.password)
        params = {
            "fields": request.GET.get("fields", "id,displayName"),
            "pageSize": request.GET.get("pageSize", 50),
            "filter": request.GET.get("filter", None),
        }
        resp = api.get(self.resource, params=params).json()
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
