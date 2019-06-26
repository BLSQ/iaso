from rest_framework import viewsets
from rest_framework.response import Response
from iaso.models import Form


class FormsViewSet(viewsets.ViewSet):
    """
    API to allow retrieval of forms.

    """

    authentication_classes = []
    permission_classes = []

    def list(self, request):
        queryset = Form.objects.order_by("id")

        return Response({"forms": [form.as_dict() for form in queryset]})
