from rest_framework import viewsets
from rest_framework.response import Response

from .auth.authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication

import os
import json

def load_canned_response(filename):
    with open(os.path.join(os.path.dirname(__file__), filename), "r", encoding="utf-8") as f:
        document = json.load(f)
        return document

class CompletenessViewSet(viewsets.ViewSet):
    """
    list:
    """

    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_classes = []

    def list(self, request):

        period_type = request.GET.get("period_type", "QUARTER")
        return Response(
            {
                "completeness": load_canned_response('fixtures/completeness_'+ period_type + '.json')
            }
        )
