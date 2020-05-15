from rest_framework import viewsets, permissions
from rest_framework.response import Response
from iaso.models import Link, OrgUnit
from django.core.paginator import Paginator
from django.shortcuts import get_object_or_404
from django.db.models import Q
from copy import deepcopy
from hat.audit.models import log_modification, ORG_UNIT_API
from time import gmtime, strftime
from django.http import StreamingHttpResponse, HttpResponse
from hat.api.export_utils import Echo, generate_xlsx, iter_items
from hat.geo.geojson import geojson_queryset
from .common import HasPermission


class LinkViewSet(viewsets.ViewSet):
    """ Links API

    This API is restricted to authenticated users having the "menupermissions.iaso_links" permission

    GET /api/links/
    GET /api/links/<id>
    PATCH /api/links/<id>
    """

    permission_required = []
    permission_classes = [
        permissions.IsAuthenticated,
        HasPermission("menupermissions.iaso_links"),
    ]

    def list(self, request):
        limit = request.GET.get("limit", None)
        page_offset = request.GET.get("page", 1)
        order = request.GET.get("order", "id").split(",")
        validated = request.GET.get("validated", None)
        search = request.GET.get("search", None)

        org_unit_type_id = request.GET.get("orgUnitTypeId", None)
        origin = request.GET.get("origin", None)
        destination = request.GET.get("destination", None)
        origin_version = request.GET.get("originVersion", None)
        destination_version = request.GET.get("destinationVersion", None)
        validator_id = request.GET.get("validatorId", None)
        algorithm_id = request.GET.get("algorithmId", None)
        algorithm_run_Id = request.GET.get("algorithmRunId", None)
        run_id = request.GET.get("run", None)
        score = request.GET.get("score", None)
        csv_format = request.GET.get("csv", None)
        xlsx_format = request.GET.get("xlsx", None)
        queryset = Link.objects.order_by(*order)

        if not request.user.is_anonymous:
            profile = request.user.iaso_profile
            queryset = queryset.filter(
                source__version__data_source__projects__account=profile.account
            )

        if search:
            queryset = queryset.filter(
                Q(destination__name__icontains=search)
                | Q(destination__aliases__contains=[search])
            )
            queryset = queryset.filter(
                Q(source__name__icontains=search)
                | Q(source__aliases__contains=[search])
            )

        if validated == "true":
            queryset = queryset.filter(validated=True)
        if validated == "false":
            queryset = queryset.filter(validated=False)

        if destination:
            queryset = queryset.filter(destination__version__data_source_id=destination)

        if origin:
            queryset = queryset.filter(source__version__data_source_id=origin)

        if destination_version:
            queryset = queryset.filter(destination__version__number=destination_version)

        if origin_version:
            queryset = queryset.filter(source__version__number=origin_version)

        if validator_id:
            queryset = queryset.filter(validator=validator_id)

        if algorithm_id:
            queryset = queryset.filter(algorithm_run__algorithm=algorithm_id)

        if algorithm_run_Id:
            queryset = queryset.filter(algorithm_run_id=algorithm_run_Id)

        if run_id:
            queryset = queryset.filter(algorithm_run=run_id)
        if score:
            scoreList = score.split(",")
            score_lower_bound = scoreList[0]
            score_upper_bound = scoreList[1]
            if score_lower_bound:
                queryset = queryset.filter(similarity_score__gte=score_lower_bound)

            if score_upper_bound:
                queryset = queryset.filter(similarity_score__lte=score_upper_bound)

        if org_unit_type_id:
            queryset = queryset.filter(
                Q(destination__org_unit_type_id__in=org_unit_type_id.split(","))
                | Q(source__org_unit_type_id__in=org_unit_type_id.split(","))
            )
        queryset = queryset.distinct()
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

    def retrieve(self, request, pk=None):
        link = get_object_or_404(Link, id=pk)
        res = link.as_full_dict()
        res["source"]["geo_json"] = None
        res["destination"]["geo_json"] = None
        if link.source.simplified_geom:
            queryset = OrgUnit.objects.all().filter(id=link.source.id)
            res["source"]["geo_json"] = geojson_queryset(
                queryset, geometry_field="simplified_geom"
            )
        if link.destination.simplified_geom:
            queryset = OrgUnit.objects.all().filter(id=link.destination.id)
            res["destination"]["geo_json"] = geojson_queryset(
                queryset, geometry_field="simplified_geom"
            )
        return Response(res)
