from rest_framework import viewsets
from rest_framework.response import Response
from .authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication
from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from hat.menupermissions.models import CustomPermissionSupport
from django.utils.translation import gettext as _
from hat.cases.models import (
    CaseView,
    Case,
    RES_POSITIVE,
    RES_POSITIVE_POSITIVE_POSITIVE,
    RES_POSITIVE_POSITIVE,
    RES_NEGATIVE,
    RES_ABSENT,
    RES_MISSING,
    RES_UNREADABLE,
    RES_UNUSED,
    testResultString,
)


class TestsMappingViewSet(viewsets.ViewSet):
    """
    Api to list results strings for a test
    """

    def list(self, request):
        res = {
            RES_POSITIVE: testResultString(RES_POSITIVE),
            RES_POSITIVE_POSITIVE_POSITIVE: testResultString(
                RES_POSITIVE_POSITIVE_POSITIVE
            ),
            RES_POSITIVE_POSITIVE: testResultString(RES_POSITIVE_POSITIVE),
            RES_NEGATIVE: testResultString(RES_NEGATIVE),
            RES_ABSENT: testResultString(RES_ABSENT),
            RES_MISSING: testResultString(RES_MISSING),
            RES_UNREADABLE: testResultString(RES_UNREADABLE),
            RES_UNUSED: testResultString(RES_UNUSED),
        }

        content_type = ContentType.objects.get_for_model(CustomPermissionSupport)
        perms = (
            Permission.objects.filter(content_type=content_type)
            .filter(codename__startswith="x_")
            .order_by("id")
        )

        result = []
        for permission in perms:
            result.append(
                {
                    "id": permission.id,
                    "name": _(permission.name),
                    "codename": permission.codename,
                }
            )

        return Response(res)
