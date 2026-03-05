import csv

from itertools import chain

from rest_framework.negotiation import DefaultContentNegotiation
from rest_framework.renderers import BaseRenderer

from hat.api.export_utils import generate_xlsx
from iaso.api.common import CONTENT_TYPE_CSV, CONTENT_TYPE_XLSX


class LegacyExportContentNegotation(DefaultContentNegotiation):
    """Support `csv` and `xlsx` query parameters for content negotiation.

    While DRF uses the `format` query parameter out of the box, we support
    using `csv=true` or `xlsx=true` for legacy API compatibility.
    """

    GET_PARAMETERS = ("csv", "xlsx")

    def select_renderer(self, request, renderers, format_suffix=None):
        query_formats = [f for f in self.GET_PARAMETERS if request.query_params.get(f)]

        for renderer in renderers:
            if renderer.format in query_formats:
                return renderer, renderer.media_type

        return super().select_renderer(request, renderers, format_suffix)


class BaseStreamingExportRenderer(BaseRenderer):
    """
    Base class for Renderers that support a streaming response with
    Django's StreamingHttpResponse.
    """

    streaming = True

    def render(self, data, accepted_media_type=None, renderer_context=None):
        """Fallback method when `stream` is not called by the view."""
        return b"".join(self.stream(data, renderer_context))

    def stream(self, data_iterator, renderer_context=None):
        """Alternative to render() for streamable data.

        Implementers should take an iterable of serialized data (dicts) and return a
        generator of bytestrings.

        Then, use renderer with django.http.StreamingHttpResponse:
        >>> response = StreamingHttpResponse(renderer.stream(data), content_type='text/csv')
        >>> response['Content-Disposition'] = 'attachment; filename="file.csv"'
        """
        raise NotImplementedError()


class Echo:
    """File-like pseudo buffer for streamed responses."""

    def write(self, value):
        return value


class CSVStreamingRenderer(BaseStreamingExportRenderer):
    """CSV renderer with streaming output support."""

    media_type = CONTENT_TYPE_CSV
    format = "csv"

    def stream(self, data_iterator, renderer_context=None):
        """Render the incoming iterable of dicts to csv.

        Will use the first row to determine the columns, make sure to pass
        dictionaries with consistent keys and no nested data.
        """

        def stream_data(iterator):
            buffer = Echo()

            # UTF-8 BOM for Excel compatibility
            yield "\ufeff".encode()

            try:
                iterator = iter(iterator)
                first_row = next(iterator)
            except StopIteration:
                return

            headers = list(first_row.keys())
            writer = csv.DictWriter(buffer, fieldnames=headers, extrasaction="ignore", restval="")

            yield writer.writeheader().encode()
            yield writer.writerow(first_row).encode()

            for row in iterator:
                yield writer.writerow(row).encode()

        return stream_data(data_iterator)


class XlsxStreamingRenderer(BaseStreamingExportRenderer):
    """Xslx iterative renderer."""

    media_type = CONTENT_TYPE_XLSX
    format = "xlsx"

    def stream(self, data_iterator, renderer_context=None):
        """Build the xlsx file iteratively and stream its contents.

        As a limitation of xlswriter, the whole file is built in-memory first.
        """
        try:
            first_row = next(data_iterator)
        except StopIteration:
            yield b""
            return

        # For now, set all column widths to 20
        # See BrowsableAPIRenderer's use of the style parameter on serializer fields as an improvement idea
        columns = list(first_row.keys())
        column_descriptors = [{"title": column, "width": 20} for column in columns]
        sheet_name = renderer_context and renderer_context.get("export_sheet_name", "export")

        def get_row(item, **kwargs):
            return [item[col] for col in columns]

        buffer = generate_xlsx(
            sheet_name=sheet_name,
            columns=column_descriptors,
            queryset=chain([first_row], data_iterator),
            get_row=get_row,
        )

        try:
            chunk_size = 8192
            while True:
                chunk = buffer.read(chunk_size)
                if not chunk:
                    break
                yield chunk

        finally:
            buffer.close()
