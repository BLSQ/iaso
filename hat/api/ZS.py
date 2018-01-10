from rest_framework import viewsets
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from hat.geo.models import ZS


class ZSViewSet(viewsets.ViewSet):
    def list(self, request):
        province_id = request.GET.get("province_id", None)
        queryset = ZS.objects.all()
        if province_id:
            queryset=queryset.filter(province_id=province_id)
        return Response(queryset.values('name', 'id'))

    def retrieve(self, request, pk=None):
        zs = get_object_or_404(ZS, pk=pk)
        return Response(zs.as_dict())
