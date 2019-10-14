from rest_framework import viewsets
from rest_framework.response import Response
from iaso.models import Link
from django.core.paginator import Paginator
from django.shortcuts import get_object_or_404
from django.db.models import Q
from copy import deepcopy
from hat.audit.models import log_modification, ORG_UNIT_API
from hat.api.authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication
from time import gmtime, strftime
from django.http import StreamingHttpResponse, HttpResponse
from hat.api.export_utils import Echo, generate_xlsx, iter_items


class LinkViewSet(viewsets.ViewSet):
    """
    list:
    """

    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_classes = []

    def list(self, request):
        limit = request.GET.get("limit", None)
        page_offset = request.GET.get("page", 1)
        order = request.GET.get("order", "id").split(",")
        validated = request.GET.get("validated", None)
        search = request.GET.get("search", None)

        org_unit_type_id = request.GET.get("orgUnitTypeId", None)
        source_id_1 = request.GET.get("source1", None)
        source_id_2 = request.GET.get("source2", None)

        version_id_1 = request.GET.get("version1", None)
        version_id_2 = request.GET.get("version2", None)
        validator_id = request.GET.get("validator_id", None)
        algorithm_id = request.GET.get("algo", None)
        run_id = request.GET.get("run", None)
        score_lower_bound = request.GET.get("scoreLowerBound", None)
        score_upper_bound = request.GET.get("scoreUpperBound", None)
        csv_format = request.GET.get("csv", None)
        xlsx_format = request.GET.get("xlsx", None)
        queryset = Link.objects.order_by(*order)

        if search:
            queryset = queryset.filter(
                Q(destination__name__icontains=search)
                | Q(destination__aliases__contains=[search])
            )
            queryset = queryset.filter(
                Q(source__name__icontains=search)
                | Q(source__aliases__contains=[search])
            )

        if validated == 'true':
            queryset = queryset.filter(validated=True)
        if validated == 'false':
            queryset = queryset.filter(validated=False)

        if source_id_1:
            queryset = queryset.filter(destination__version__data_source_id=source_id_1)

        if source_id_2:
            queryset = queryset.filter(source__version__data_source_id=source_id_2)

        if version_id_1:
            queryset = queryset.filter(destination__version=version_id_1)

        if version_id_2:
            queryset = queryset.filter(destination__version=version_id_2)

        if validator_id:
            queryset = queryset.filter(validator=validator_id)

        if algorithm_id:
            queryset = queryset.filter(algorithm_run__algorithm=algorithm_id)

        if run_id:
            queryset = queryset.filter(algorithm_run=run_id)

        if score_lower_bound:
            queryset = queryset.filter(similarity_score__gte=score_lower_bound)

        if score_upper_bound:
            queryset = queryset.filter(similarity_score__lte=score_upper_bound)

        if org_unit_type_id:
            queryset = queryset.filter(
                Q(destination__org_unit_type_id=org_unit_type_id)
                | Q(source__org_unit_type_id=org_unit_type_id)
            )

        if csv_format is None and xlsx_format is None:
            if limit:
                limit = int(limit)
                page_offset = int(page_offset)

                paginator = Paginator(queryset, limit)
                res = {"count": paginator.count}
                if page_offset > paginator.num_pages:
                    page_offset = paginator.num_pages
                page = paginator.page(page_offset)

                res["links"] = map(lambda x: x.as_dict(), page.object_list)
                res["has_next"] = page.has_next()
                res["has_previous"] = page.has_previous()
                res["page"] = page_offset
                res["pages"] = paginator.num_pages
                res["limit"] = limit
                return Response(res)
            else:
                queryset = queryset
                return Response({"links": [link.as_dict() for link in queryset]})
        else:
            columns = [
                {"title": "ID", "width": 20},
                {"title": "Run", "width": 20},
                {"title": "Destination", "width": 20},
                {"title": "Source", "width": 20},
                {"title": "Validated", "width": 40},
                {"title": "Validator", "width": 20},
                {"title": "Validation Date", "width": 20},
                {"title": "Creation Date", "width": 20},
                {"title": "Score", "width": 20},
            ]

            filename = "links"
            filename = "%s-%s" % (filename, strftime("%Y-%m-%d-%H-%M", gmtime()))

            def get_row(link, **kwargs):

                link_values = [
                    link.id,
                    link.algorithm_run_id,
                    link.destination_id,
                    link.source_id,
                    link.validated,
                    link.validator_id,
                    link.validation_date,
                    link.created_at,
                    link.similarity_score,
                ]
                return link_values

            if xlsx_format:
                filename = filename + ".xlsx"
                response = HttpResponse(
                    generate_xlsx("Forms", columns, queryset, get_row),
                    content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                )
            if csv_format:
                response = StreamingHttpResponse(
                    streaming_content=(iter_items(queryset, Echo(), columns, get_row)),
                    content_type="text/csv",
                )
                filename = filename + ".csv"
            response["Content-Disposition"] = "attachment; filename=%s" % filename
            return response

    def partial_update(self, request, pk=None):
        link = get_object_or_404(Link, id=pk)
        original_copy = deepcopy(link)
        validated = request.data.get("validated", None)
        if validated is not None:
            link.validated = validated
        if validated == True:
            link.validator = request.user
        if validated == False:
            link.validator = None

        log_modification(original_copy, link, source=ORG_UNIT_API, user=request.user)
        link.save()

        res = link.as_dict()

        return Response(res)
