from rest_framework import viewsets
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from hat.cases.models import Case
from .authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication
from django.core.paginator import Paginator
from django.db.models import Q


class CasesViewSet(viewsets.ViewSet):
    """
    Api to list all cases,  retrieve information about just one.

    Example:
        /api/cases/?limit=50&page=1&geo_search=zo

    """

    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_required = [
        'menupermissions.x_locator'
    ]

    def list(self, request):
        limit = int(request.GET.get("limit", 50))
        page_offset = int(request.GET.get("page", 1))

        orders = request.GET.get("order", "ZS").split(",")

        province_ids = request.GET.get("province_id", None)
        zs_ids = request.GET.get("zs_id", None)
        as_ids = request.GET.get("as_id", None)
        years = request.GET.get("years", None)
        teams = request.GET.get("teams", None)
        geo_search = request.GET.get("geo_search", None)
        normalized = request.GET.get("normalized", None)

        queryset = (
            Case.objects.filter(normalized_village=None, normalized_village_not_found=False, confirmed_case=True)
            .exclude(source="mobile_sync")
            .exclude(source="mobile_backup")
            .exclude(province__icontains="kas")
            .exclude(province__icontains="kinsh")
            .exclude(province__icontains="bas")
            .exclude(province__icontains="maniema")
            .exclude(province__icontains="k.")
            .exclude(province__icontains="equateur")
            .exclude(Q(form_year=None) & Q(mobile_unit=None) & Q(form_number=None))
            .order_by(*orders)
        )

        if province_ids:
            queryset = queryset.filter(normalized_AS__ZS__province_id__in=province_ids.split(","))
        if zs_ids:
            queryset = queryset.filter(normalized_AS__ZS_id__in=zs_ids.split(","))
        if as_ids:
            queryset = queryset.filter(normalized_AS_id__in=as_ids.split(","))
        if years:
            queryset = queryset.filter(form_year__in=years.split(","))
        if teams:
            queryset = queryset.filter(normalized_team_id__in=teams.split(","))


        if normalized is not None:
            if normalized != 'true':
                queryset = queryset.filter(normalized_AS__isnull=True)
            else:
                queryset = queryset.exclude(normalized_AS__isnull=True)

        if geo_search:
            queryset = queryset.filter(
                Q(village__icontains=geo_search) | Q(ZS__icontains=geo_search) | Q(AS__icontains=geo_search)
            )

        paginator = Paginator(queryset, limit)

        res = {"count": paginator.count}
        if page_offset > paginator.num_pages:
            page_offset = paginator.num_pages
        page = paginator.page(page_offset)

        res["cases"] = map(lambda x: x.as_dict(), page.object_list)
        res["has_next"] = page.has_next()
        res["has_previous"] = page.has_previous()
        res["page"] = page_offset
        res["pages"] = paginator.num_pages
        res["limit"] = limit

        return Response(res)

    def retrieve(self, request, pk=None):
        case = get_object_or_404(Case, pk=pk)
        return Response(case.as_dict())

    def partial_update(self, request, pk=None):
        case = get_object_or_404(Case, pk=pk)
        village_id = request.data.get("village_id", None)
        not_found = request.data.get("not_found", None)

        if village_id:
            case.normalized_village_not_found = False
            case.normalized_village_id = village_id
            case.save()
        elif not_found:
            case.normalized_village_not_found = True
            case.normalized_village_id = None
            case.save()

        return Response(case.as_dict())
