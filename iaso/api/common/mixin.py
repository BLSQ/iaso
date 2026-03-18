from datetime import datetime

from django.http import HttpResponse
from rest_framework.decorators import action
from rest_framework_csv.renderers import CSVRenderer


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
