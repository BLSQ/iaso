from time import process_time
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.authentication import BasicAuthentication
from rest_framework import viewsets
from django.core.exceptions import PermissionDenied
from .auth.authentication import CsrfExemptSessionAuthentication

from dhis2 import RequestException
from dhis2 import Api

from iaso.models import DataSource


class Dhis2ViewSet(viewsets.ViewSet):
    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_classes = []

    def list(self, request, datasource_id, format="json"):

        sources = DataSource.objects.all()
        if not request.user.is_anonymous:
            profile = request.user.iaso_profile
            sources = sources.filter(
                projects__account=profile.account, id=datasource_id
            )
        else:
            raise PermissionDenied()
        data_source = sources.all()[0]

        credentials = data_source.credentials

        if not credentials:
            return Response(
                {"error": "no credentials configured"},
                status=status.HTTP_501_NOT_IMPLEMENTED,
            )

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
