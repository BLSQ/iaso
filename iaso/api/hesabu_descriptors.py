from time import process_time
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.authentication import BasicAuthentication
from rest_framework import viewsets
from django.core.exceptions import PermissionDenied
from .auth.authentication import CsrfExemptSessionAuthentication

from iaso.models import DataSource

import os

import json


def load_fixture_response(filename):
    with open(
        os.path.join(os.path.dirname(__file__), filename), "r", encoding="utf-8"
    ) as f:
        document = json.load(f)
        return document


class HesabuDescriptorsViewSet(viewsets.ViewSet):
    resource = "hesabudescriptors"

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

        return Response(
            {
                "hesabudescriptors": [
                    load_fixture_response("fixtures/hesabu.dhis2.fbrcameroun.org.json")
                ]
            }
        )
