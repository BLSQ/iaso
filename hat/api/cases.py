from rest_framework import viewsets
from rest_framework.response import Response
from django.http import StreamingHttpResponse
from django.shortcuts import get_object_or_404
from hat.cases.models import CaseView, Case, RES_POSITIVE
from hat.audit.models import log_modification, CASE_API
from .authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication
from django.core.paginator import Paginator
from django.db.models import Q
import csv
from copy import copy


class CasesViewSet(viewsets.ViewSet):
    """
    Api to list all cases,  retrieve information about just one.
    Allowed search criteria:
    - province_id
    - zs_id
    - as_id
    - years
    - teams
    - from
    - to
    - geo_search
    - normalized
    - csv: return data in CSV format rather than JSON. Intended for download
    - located: show already located cases
    - screening_result: result of the most significant screening test
    - confirmation_result: result of the most significant confirmation test
    - source: pv, historic, mobile_sync, mobile_backup
    - search: substring search in first/last/post-name
    - coordination: coordination ID

    Example:
        /api/cases/?limit=50&page=1&geo_search=zo

    """

    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_required = [
        'menupermissions.x_locator', 'menupermissions.x_case_cases'
    ]

    def list(self, request):
        limit = int(request.GET.get("limit", 50))
        page_offset = int(request.GET.get("page", 1))

        orders = request.GET.get("order", "ZS").split(",")

        province_ids = request.GET.get("province_id", None)
        zs_ids = request.GET.get("zs_id", None)
        as_ids = request.GET.get("as_id", None)
        village_ids = request.GET.get("village_id", None)
        years = request.GET.get("years", None)
        teams = request.GET.get("team_id", None)

        coordination_ids = request.GET.get("coordination_id", None)
        from_date = request.GET.get("from", None)
        to_date = request.GET.get("to", None)
        geo_search = request.GET.get("geo_search", None)
        normalized = request.GET.get("normalized", None)
        csv_format = request.GET.get("csv", None)  # default will be json
        located = request.GET.get("located", 'all')
        screening_result = request.GET.get("screening_result", None)
        confirmation_result = request.GET.get("confirmation_result", None)
        source = request.GET.get("source", None)
        search_name = request.GET.get("search_name", None)
        search_prename = request.GET.get("search_prename", None)
        search_lastname = request.GET.get("search_lastname", None)
        coordination = request.GET.get("coordination", None)
        is_locator = request.GET.get("isLocator", None)

        if located == 'all':
            queryset = CaseView.objects.order_by(*orders)

        if is_locator == 'true':
            queryset = (
                CaseView.objects.filter(normalized_village=None, normalized_village_not_found=False, confirmed_case=True)
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

        if located == 'only_not_located':
            queryset = (
                CaseView.objects.filter(normalized_village=None)
                .order_by(*orders)
            )

        if located == 'only_not_located_and_not_found':
            queryset = (
                CaseView.objects.filter(normalized_village=None, normalized_village_not_found=True)
                .order_by(*orders)
            )

        if located == 'only_located':
            queryset = (
                CaseView.objects.filter(normalized_village__isnull=False)
                .order_by(*orders)
            )

        if located != 'all':
            queryset = queryset.exclude(source="mobile_sync").exclude(source="mobile_backup").exclude(province__icontains="kas").exclude(province__icontains="kinsh").exclude(province__icontains="bas").exclude(province__icontains="maniema").exclude(province__icontains="k.").exclude(province__icontains="equateur")

        if province_ids:
            queryset = queryset.filter(normalized_AS__ZS__province_id__in=province_ids.split(","))
        if coordination_ids:
            queryset = queryset.filter(normalized_team__coordination__id__in=coordination_ids.split(","))
        if zs_ids:
            queryset = queryset.filter(normalized_AS__ZS_id__in=zs_ids.split(","))
        if as_ids:
            queryset = queryset.filter(normalized_AS_id__in=as_ids.split(","))
        if village_ids:
            queryset = queryset.filter(normalized_village_id__in=village_ids.split(","))
        if years:
            queryset = queryset.filter(form_year__in=years.split(","))
        if teams:
            queryset = queryset.filter(normalized_team_id__in=teams.split(","))
        if from_date:
            queryset = queryset.filter(normalized_date__gte=from_date)
        if to_date:
            queryset = queryset.filter(normalized_date__lte=to_date)

        if source:
            queryset = queryset.filter(source=source)
        if search_name:
            queryset = queryset.filter(
                Q(name__icontains=search_name)
            )
        if search_prename:
            queryset = queryset.filter(
                Q(prename__icontains=search_prename)
            )
        if search_lastname:
            queryset = queryset.filter(
                Q(lastname__icontains=search_lastname)
            )

        if screening_result is not None:
            if screening_result == 'true':
                queryset = queryset.filter(screening_result__gte=RES_POSITIVE)
            else:
                queryset = queryset.filter(screening_result__lt=RES_POSITIVE)
        if confirmation_result is not None:
            queryset = queryset.filter(confirmed_case=(confirmation_result == 'true'))

        if normalized is not None:
            if normalized != 'true':
                queryset = queryset.filter(normalized_AS__isnull=True)
            else:
                queryset = queryset.exclude(normalized_AS__isnull=True)

        if coordination:
            queryset = queryset.filter(normalized_team__coordination_id=coordination)

        if geo_search:
            queryset = queryset.filter(
                Q(village__icontains=geo_search) | Q(ZS__icontains=geo_search) | Q(AS__icontains=geo_search)
            )

        if csv_format is None:

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
        else:
            class Echo:
                """An object that implements just the write method of the file-like
                interface.
                """

                def write(self, value):
                    """Write the value by returning it, instead of storing in a buffer."""
                    return value

            def iter_items(queryset, pseudo_buffer):
                headers = ['Identifiant', 'UM', 'Année', 'Source', 'Province encodée', 'ZS encodée', 'AS encodée', 'Village encodé', 'Nom', 'Prénom', 'Postnom', 'AS trouvée']
                writer = csv.writer(pseudo_buffer)
                yield pseudo_buffer.write(headers)
                for case in queryset.iterator(chunk_size=5000):
                    cdict = case.as_dict()
                    row = [
                        cdict["id"],
                        cdict["mobile_unit"],
                        cdict["normalized_year"],
                        cdict["source"],
                        cdict["province"],
                        cdict["ZS"],
                        cdict["AS"],
                        cdict["village"],
                        cdict["name"],
                        cdict["prename"],
                        cdict["lastname"],
                        cdict["normalized_AS_name"]
                    ]
                    yield writer.writerow(row)

            response = StreamingHttpResponse(
                streaming_content=(iter_items(queryset, Echo())),
                content_type='text/csv',
            )
            response['Content-Disposition'] = 'attachment;filename=cases.csv'
            return response

    def retrieve(self, request, pk=None):
        case = get_object_or_404(Case, pk=pk)
        return Response(case.as_dict())

    def partial_update(self, request, pk=None):
        case = get_object_or_404(Case, pk=pk)
        original_copy = copy(case)
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

        log_modification(original_copy, case, source=CASE_API, user=request.user)

        return Response(case.as_dict())
