from rest_framework import viewsets
from rest_framework.authentication import BasicAuthentication

from hat.api.authentication import CsrfExemptSessionAuthentication
from hat.quality.models import Check
from hat.quality.serializers import CheckSerializer


class QCChecksViewSet(viewsets.ModelViewSet):
    """
    API to handle checks on tests.

    The username of the validator is provided for display but is forced to the logged in user when creating or updating.
    """

    queryset = Check.objects.all()
    serializer_class = CheckSerializer
    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)


