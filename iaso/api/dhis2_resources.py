from time import process_time
from rest_framework import status
from rest_framework.response import Response
from rest_framework import viewsets
from django.core.exceptions import PermissionDenied

from dhis2 import Api

from iaso.models import DataSource


class Dhis2ViewSet(viewsets.ViewSet):
    permission_classes = []

    def list(self, request, datasource_id, format="json"):

        sources = DataSource.objects.all()
        if not request.user.is_anonymous:
            profile = request.user.iaso_profile
            data_source = sources.filter(
                projects__account=profile.account, id=datasource_id
            ).first()
        else:
            raise PermissionDenied()

        if data_source is None:
            return Response(
                {"error": "Data source not available"}, status=status.HTTP_404_NOT_FOUND
            )

        if data_source.credentials is None:
            return Response(
                {"error": "No credentials configured"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

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


DHIS2_VIEWSETS = (DataElementsViewSet, DataSetsViewSet, ProgramsViewSet)
