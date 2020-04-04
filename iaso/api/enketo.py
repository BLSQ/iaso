from rest_framework import viewsets
from rest_framework.response import Response
from iaso.models import DataSource, OrgUnit

from .auth.authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication
from django.http import HttpResponse
from rest_framework import status

import os


class EnketoViewSet(viewsets.ViewSet):
    """
    list:
    """

    authentication_classes = (CsrfExemptSessionAuthentication,)
    permission_classes = []

    def list(self, request):
        print("Enketo !")
        print(self.request.GET)
        print(self.request.POST)
        return HttpResponse(
            open(
                os.path.join(os.path.dirname(__file__), "./fixtures/xforms.xml"),
                "r",
                encoding="utf-8",
            ).read(),
            content_type="application/xml",
        )

    def post(self, request):
        print("Enketo !")
        print(self.request.GET)
        print(self.request.POST)
        return HttpResponse(
            open(
                os.path.join(os.path.dirname(__file__), "./fixtures/xforms.xml"),
                "r",
                encoding="utf-8",
            ).read(),
            content_type="application/xml",
        )

    def getformxml(self, request):
        print("Enketo !")
        print(self.request.GET)
        print(self.request.POST)
        return HttpResponse(
            open(
                os.path.join(os.path.dirname(__file__), "./fixtures/sample-form.xml"),
                "r",
                encoding="utf-8",
            ).read(),
            content_type="application/xml",
        )

    def getsubmission(self, request):
        if request.method.upper() == "HEAD":
            resp = HttpResponse("", status=status.HTTP_204_NO_CONTENT)
            resp["x-openrosa-accept-content-length"] = 100000000
            return resp

        print("Enketo !")
        print(self.request.GET)
        print(self.request.POST)
        return HttpResponse(
            open(
                os.path.join(os.path.dirname(__file__), "./fixtures/sample-form.xml"),
                "r",
                encoding="utf-8",
            ).read(),
            content_type="application/xml",
        )
