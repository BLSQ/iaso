from django.core.exceptions import PermissionDenied
from rest_framework import viewsets
from rest_framework.response import Response
from iaso.models import ExportRequest
from .auth.authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication
from django.core.paginator import Paginator


class ExportRequestsViewSet(viewsets.ViewSet):
    """
    list export_requests:
    """

    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_classes = []
    results_key = "export_requests"

    def list(self, request):
        queryset = ExportRequest.objects.all()
        queryset = queryset.order_by("-id")

        if self.request.user and not self.request.user.is_anonymous:
            profile = self.request.user.iaso_profile
            queryset = queryset.filter(launcher__iaso_profile__account=profile.account)
        else:
            raise PermissionDenied()

        limit = request.GET.get("limit", 100)
        page_offset = request.GET.get("page", 1)

        limit = min(int(limit), 100)
        page_offset = int(page_offset)
        paginator = Paginator(queryset, limit)
        if page_offset > paginator.num_pages:
            page_offset = paginator.num_pages
        page = paginator.page(page_offset)

        res = {"count": paginator.count}
        res[self.results_key] = [item.as_dict() for item in page.object_list]
        res["has_next"] = page.has_next()
        res["has_previous"] = page.has_previous()
        res["page"] = page_offset
        res["pages"] = paginator.num_pages
        res["limit"] = limit
        return Response(res)
