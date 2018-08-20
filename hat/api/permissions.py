from rest_framework import viewsets
from rest_framework.response import Response
from .authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication
from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from hat.menupermissions.models import CustomPermissionSupport
from django.utils.translation import gettext as _


class PermissionsViewSet(viewsets.ViewSet):
    """
    Api to list all permissions assignable by the user interface (outside of the admin)
    """

    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)

    def list(self, request):
        content_type = ContentType.objects.get_for_model(CustomPermissionSupport)
        perms = Permission.objects.filter(content_type=content_type).filter(codename__startswith="x_")

        result = []
        for permission in perms:
            result.append({"name": _(permission.name), "codename": permission.codename})

        return Response(result)

