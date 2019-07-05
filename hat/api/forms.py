from rest_framework import viewsets
from rest_framework.response import Response
from iaso.models import Form, Instance
from django.core.paginator import Paginator
from django.shortcuts import get_object_or_404

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
        queryset = Form.objects.order_by("id")
        limit = request.GET.get("limit", None)
        page_offset = request.GET.get("page", 1)
        orders = request.GET.get("order", "updated_at").split(",")
        csv_format = request.GET.get("csv", None)
        xlsx_format = request.GET.get("xlsx", None)

        queryset = queryset.order_by(*orders)

        if csv_format is None and xlsx_format is None:
            if limit:
                limit = int(limit)
                page_offset = int(page_offset)

                paginator = Paginator(queryset, limit)
                res = {"count": paginator.count}
                if page_offset > paginator.num_pages:
                    page_offset = paginator.num_pages
                page = paginator.page(page_offset)

                res["forms"] = map(lambda x: x.as_dict(), page.object_list)
                res["has_next"] = page.has_next()
                res["has_previous"] = page.has_previous()
                res["page"] = page_offset
                res["pages"] = paginator.num_pages
                res["limit"] = limit
                return Response(res)
            else:
                return Response({"forms": [form.as_dict() for form in queryset]})
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

            def get_row(form, **kwargs):
                fdict = form.as_dict()
                created_at = timestamp_to_datetime(fdict.get("created_at"))
                updated_at = timestamp_to_datetime(fdict.get("updated_at"))
                org_unit_types = ", ".join([o['name'] for o in fdict.get("org_unit_types") if o is not None])
                return [
                    fdict.get("form_id"),
                    fdict.get("name"),
                    fdict.get("instancesCount"),
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