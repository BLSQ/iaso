from datetime import datetime

from django.db.models import ProtectedError
from django.http import HttpResponse
from rest_framework.decorators import action
from rest_framework.exceptions import MethodNotAllowed
from rest_framework.mixins import DestroyModelMixin, ListModelMixin
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework_csv.renderers import CSVRenderer

from iaso.api.common.pagination import Paginator


class CSVExportMixin:
    @action(
        detail=False,
        methods=["GET"],
    )
    def export_csv(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        serializer_class = self.exporter_serializer_class
        serializer = serializer_class(queryset, many=True, context=self.get_serializer_context())
        data = serializer.data
        renderer = CSVRenderer()
        # Determine the order of fields
        if self.use_field_order:
            renderer.header = serializer.child.fields
        # Get column names
        if hasattr(serializer_class.Meta, "labels"):
            renderer.labels = serializer_class.Meta.labels

        date = datetime.now().strftime("%Y-%m-%d")
        filename = self.export_filename.format(date=date)
        response = HttpResponse(
            content_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"},
            content=renderer.render(data),
        )
        return response


class CustomPaginationListModelMixin(ListModelMixin):
    results_key = "results"
    # FIXME Contrary to name it remove result key if NOT paginated
    remove_results_key_if_paginated = False

    def pagination_class(self):
        return Paginator(self.get_results_key())

    def get_results_key(self):
        """
        Get the key to use for results in list responses (resource-specific)

        Example: if your resource is CarManufacturer, use "car_manufacturers", so that the list responses look like
        {
            "car_manufacturers": [
                {"id": 1, name  : "Honda"},
                {"id": 2, name: "Toyota"},
            ]
        }
        """
        assert self.results_key is not None, (
            "'%s' should either include a `results_key` attribute, "
            "or override the `get_result_key()` method." % self.__class__.__name__
        )

        return self.results_key

    def list(self, request: Request, *args, **kwargs):
        # """Override to return responses with {"result_key": data} structure"""

        queryset = self.filter_queryset(self.get_queryset())

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        if not self.remove_results_key_if_paginated:
            return Response({self.get_results_key(): serializer.data})
        return Response(serializer.data)


class ProtectDestroyMixin(DestroyModelMixin):
    def perform_destroy(self, instance):
        """Handle ProtectedError (prevent deletion of instances when linked to protected models)"""

        try:
            super().perform_destroy(instance)
        except ProtectedError as e:
            instance_model_name = instance.__class__.__name__
            linked_model_name = e.protected_objects.model.__name__

            raise MethodNotAllowed(
                self.request.method,
                f"Cannot delete {instance_model_name} as it is linked to one or more {linked_model_name}s",
            )
