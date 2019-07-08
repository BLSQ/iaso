from rest_framework import viewsets
from rest_framework.response import Response
from iaso.models import Form, Instance
from django.core.paginator import Paginator
from django.shortcuts import get_object_or_404
from django.db.models import Max, Sum, Q

from django.http import StreamingHttpResponse, HttpResponse
from .export_utils import Echo, generate_xlsx, iter_items
from iaso.utils import timestamp_to_datetime

class FormsViewSet(viewsets.ViewSet):
    """
    API to allow retrieval of forms.

    """

    authentication_classes = []
    permission_classes = []

    def list(self, request):
        queryset = Form.objects
        limit = request.GET.get("limit", None)
        page_offset = request.GET.get("page", 1)
        order = request.GET.get("order", "instance__updated_at").split(",")
        from_date = request.GET.get("date_from", None)
        to_date = request.GET.get("date_to", None)
        csv_format = request.GET.get("csv", None)
        xlsx_format = request.GET.get("xlsx", None)
        queryset = queryset.annotate(instance__updated_at=Max("instance__updated_at"))
        queryset = queryset.annotate(instances_count=Sum("instance"))
        additional_fields = ["instance__updated_at", "instances_count"]
        queryset = queryset.order_by(*order)
        if from_date:
            queryset = queryset.filter(Q(instance__updated_at__gte=from_date) | Q(created_at__gte=from_date) | Q(updated_at__gte=from_date))

        if to_date:
            queryset = queryset.filter(Q(instance__updated_at__lte=to_date) | Q(created_at__lte=to_date) | Q(updated_at__lte=to_date))


        if csv_format is None and xlsx_format is None:
            if limit:
                limit = int(limit)
                page_offset = int(page_offset)

                paginator = Paginator(queryset, limit)
                res = {"count": paginator.count}
                if page_offset > paginator.num_pages:
                    page_offset = paginator.num_pages
                page = paginator.page(page_offset)

                res["forms"] = map(lambda x: x.as_dict(additional_fields), page.object_list)
                res["has_next"] = page.has_next()
                res["has_previous"] = page.has_previous()
                res["page"] = page_offset
                res["pages"] = paginator.num_pages
                res["limit"] = limit
                return Response(res)
            else:
                return Response({"forms": [form.as_dict(additional_fields) for form in queryset]})
        else:
            columns = [
                {"title": "ID du formulaire", "width": 20},
                {"title": "Nom", "width": 40},
                {"title": "Enregistrement(s)", "width": 20},
                {"title": "Type", "width": 20},
                {"title": "Date de création", "width": 20},
                {"title": "Date de modification", "width": 20},
            ]
            filename = "forms"

            def get_row(qsform, **kwargs):
                fdict = qsform.as_dict(additional_fields)
                created_at = timestamp_to_datetime(fdict.get("created_at"))
                updated_at = fdict.get("instance__updated_at").strftime("%Y-%m-%d %H:%M:%S") if fdict.get("instance__updated_at") else None
                org_unit_types = ", ".join([o['name'] for o in fdict.get("org_unit_types") if o is not None])
                return [
                    fdict.get("form_id"),
                    fdict.get("name"),
                    fdict.get("instances_count"),
                    org_unit_types,
                    created_at,
                    updated_at,
                ]

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


    def retrieve(self, request, pk=None):
        form = get_object_or_404(Form, pk=pk)
        res = form.as_dict()
        return Response(res)
