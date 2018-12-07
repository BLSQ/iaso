from rest_framework import viewsets
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from hat.vector_control.models import Site, Target
from .authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication


class TargetsViewSet(viewsets.ViewSet):
    """
    API to allow retrieval of targets.

    """
    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_required = [
        'menupermissions.x_vectorcontrol'
    ]


    def list(self, request):

        from_date = request.GET.get("from", None)
        to_date = request.GET.get("to", None)
        queryset = Target.objects.all()

        if from_date is not None:
            queryset = queryset.filter(date_time__date__gte=from_date)
        if to_date is not None:
            queryset = queryset.filter(date_time__date__lte=to_date)
        queryset = queryset

        return Response(queryset.values('id', 'latitude', 'longitude'))

    def retrieve(self, request, pk=None):
        target = get_object_or_404(Target, pk=pk)

        return Response(target.as_dict())


