from rest_framework import viewsets
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from hat.geo.models import Province


class ProvinceViewSet(viewsets.ViewSet):
    """
    Api to list all provinces, or retrieve information about just one.
    """
    permission_required = [
        'menupermissions.x_management_users',
        'menupermissions.x_locator'
    ]
    def list(self, request):
        return Response(Province.objects.all().values('name', 'old_name', 'id').order_by('name'))

    def retrieve(self, request, pk=None):
        province = get_object_or_404(Province, pk=pk)
        return Response(province.as_dict())
