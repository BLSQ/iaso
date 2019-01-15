from rest_framework import viewsets
from rest_framework.response import Response
from django.http import StreamingHttpResponse, HttpResponse
from django.shortcuts import get_object_or_404
from hat.cases.models import CaseView, Case, RES_POSITIVE, RES_POSITIVE_POSITIVE_POSITIVE, RES_POSITIVE_POSITIVE, RES_NEGATIVE, RES_ABSENT, RES_MISSING, RES_UNREAD, RES_UNUSED, testResultString
from hat.audit.models import log_modification, CASE_API
from .authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication
from django.core.paginator import Paginator
from django.db.models import Q
from copy import copy

from .export_utils import  Echo, generate_xlsx, iter_items
from hat.users.models import get_user_geo_list, isAuthorisedUser

class CasesViewSet(viewsets.ViewSet):
    """
    Api to list all records (cases),  retrieve information about just one.
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

    To retrieve aall details on a specific record (case):
        GET /api/cases/12345?full
    All information related to the record will be returned with normalized location, patient, tests, device...
    Note that 12345 is the ID of the record, not the document_id or hat_id
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
        csv_format = request.GET.get("csv", None)
        xlsx_format = request.GET.get("xlsx", None)
        located = request.GET.get("located", 'all')
        screening_result = request.GET.get("screening_result", None)
        confirmation_result = request.GET.get("confirmation_result", None)
        source = request.GET.get("source", None)
        search_name = request.GET.get("search_name", None)
        search_prename = request.GET.get("search_prename", None)
        search_lastname = request.GET.get("search_lastname", None)
        coordination = request.GET.get("coordination", None)
        is_locator = request.GET.get("isLocator", None)
        test_types = request.GET.get("test_type", None)

        if located == 'all':
            queryset = CaseView.objects.order_by(*orders)

        if is_locator == 'true':
            queryset = (
                CaseView.objects.filter(confirmed_case=True)
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
                CaseView.objects.filter(normalized_village=None, normalized_village_not_found=False)
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

        if located != 'all' and is_locator != 'true':
            queryset = queryset.exclude(source="mobile_sync").exclude(source="mobile_backup").exclude(province__icontains="kas").exclude(province__icontains="kinsh").exclude(province__icontains="bas").exclude(province__icontains="maniema").exclude(province__icontains="k.").exclude(province__icontains="equateur")

        if coordination_ids:
            queryset = queryset.filter(normalized_team__coordination__id__in=coordination_ids.split(","))

        if not request.user.profile.province_scope.count() == 0:
            queryset = queryset.filter(normalized_AS__ZS__province_id__in=get_user_geo_list(request.user, 'province_scope')).distinct()
        if not request.user.profile.ZS_scope.count() == 0:
            queryset = queryset.filter(normalized_AS__ZS_id__in=get_user_geo_list(request.user, 'ZS_scope')).distinct()
        if not request.user.profile.AS_scope.count() == 0:
            queryset = queryset.filter(normalized_AS_id__in=get_user_geo_list(request.user, 'AS_scope')).distinct()

        if province_ids and not zs_ids and not as_ids:
            queryset = queryset.filter(normalized_AS__ZS__province_id__in=province_ids.split(","))
        else:
            if zs_ids and not as_ids:
                queryset = queryset.filter(normalized_AS__ZS_id__in=zs_ids.split(","))
            else:
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
        if not (request.user.has_perm("menupermissions.x_anonymous") and not request.user.is_superuser):
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

        if test_types:
            for test_type in test_types.split(","):
                if test_type == "catt":
                    queryset = queryset.filter(test_catt__isnull=False)
                if test_type == "rdt":
                    queryset = queryset.filter(test_rdt__isnull=False)
                if test_type == "ctc":
                    queryset = queryset.filter(test_ctcwoo__isnull=False)
                # if test_type == "ge":
                #     queryset = queryset.filter(test_ge__isnull=False)
                # if test_type == "lcr":
                #     queryset = queryset.filter(test_lcr__isnull=False)
                # if test_type == "lnp":
                #     queryset = queryset.filter(test_lymph_node_puncture__isnull=False)
                # if test_type == "sf":
                #     queryset = queryset.filter(test_sf__isnull=False)
                if test_type == "pg":
                    queryset = queryset.filter(test_pg__isnull=False)
                if test_type == "maect":
                    queryset = queryset.filter(test_maect__isnull=False)
                if test_type == "pl":
                    queryset = queryset.filter(test_pl__isnull=False)

        if csv_format is None and xlsx_format is None:

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
            if (request.user.has_perm("menupermissions.x_anonymous") and not request.user.is_superuser):
                return Response('Unauthorized', status=401)
            columns = ['Identifiant', 'UM', 'Année', 'Source', 'Province encodée', 'ZS encodée',
                'AS encodée', 'Village encodé', 'Nom', 'Postnom', 'Prénom', 'Sex', 'Age', 'CATT', 'RDT',
                'PG', 'CTCWOO', 'GE', 'LCR', 'Ponction Noeud Lymph.', 'Sang frais', 'MAECT', 'PL']

            filename = 'cases'

            def get_row(case):
                cdict = case.as_dict()
                return [
                        cdict["id"],
                        cdict["normalized_team_name"],
                        cdict["normalized_year"],
                        cdict["source"],
                        cdict["location"].get('province'),
                        cdict["location"].get('ZS'),
                        cdict["location"].get('AS'),
                        cdict["location"].get('village'),
                        cdict["patient"].get('last_name'),
                        cdict["patient"].get('post_name'),
                        cdict["patient"].get('first_name'),
                        cdict["patient"].get('sex'),
                        cdict["patient"].get('age'),
                        testResultString(case.test_catt),
                        testResultString(case.test_rdt),
                        testResultString(case.test_pg),
                        testResultString(case.test_ctcwoo),
                        testResultString(case.test_ge),
                        testResultString(case.test_lcr),
                        testResultString(case.test_lymph_node_puncture),
                        testResultString(case.test_sf),
                        testResultString(case.test_maect),
                        testResultString(case.test_pl)
                    ]
            if xlsx_format:
                filename = filename + '.xlsx'
                response = HttpResponse(
                    generate_xlsx('Cas', columns, queryset, get_row),
                    content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                )
            if csv_format:
                response = StreamingHttpResponse(
                    streaming_content=(iter_items(queryset, Echo(), columns, get_row)),
                    content_type='text/csv',
                )
                filename = filename + '.csv'
            response['Content-Disposition'] = 'attachment; filename=%s' % filename
            return response

    def retrieve(self, request, pk=None):
        full = request.GET.get('full')
        case = get_object_or_404(Case, pk=pk)
        isAuthorized = isAuthorisedUser(request.user, case.normalized_AS.ZS.province.id, case.normalized_AS.ZS.id, case.normalized_AS.id)
        if isAuthorized:
            return Response(case.as_dict(full is not None))
        else:
            return Response('Unauthorized', status=401)

    def partial_update(self, request, pk=None):
        case = get_object_or_404(Case, pk=pk)
        isAuthorized = isAuthorisedUser(request.user, case.normalized_AS.ZS.province.id, case.normalized_AS.ZS.id, case.normalized_AS.id )

        if isAuthorized:
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
        else:
            return Response('Unauthorized', status=401)
