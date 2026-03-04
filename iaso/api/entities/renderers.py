import csv

from itertools import chain

from rest_framework.negotiation import DefaultContentNegotiation
from rest_framework.renderers import BaseRenderer

from hat.api.export_utils import generate_xlsx
from iaso.api.common import CONTENT_TYPE_CSV, CONTENT_TYPE_XLSX


class LegacyExportContentNegotation(DefaultContentNegotiation):
    """Support `csv` and `xlsx` GET parameters for content negotiation.

    While DRF supports the `format` GET parameter by default, we support
    those extra parameters for legacy API compatibility.
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
        """"""
        raise NotImplementedError()


class Echo:
    """File-like pseudo buffer for streamed responses."""

    def write(self, value):
        return value


class CSVStreamingRenderer(BaseStreamingExportRenderer):
    """"""

    media_type = CONTENT_TYPE_CSV
    format = "csv"

    def stream(self, data_iterator, renderer_context=None):
        """"""
        # TODO: WIP
        # TODO: use a dictwriter here to ensure the rows are stable

        def stream_data(data_iterator):
            buffer = Echo()
            writer = csv.writer(buffer)

            first = True
            for row in data_iterator:
                if first:
                    first = False
                    yield writer.writerow(row.keys())
                yield writer.writerow(row.values())

        yield from stream_data(data_iterator)


class XlsxStreamingRenderer(BaseStreamingExportRenderer):
    """"""

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

        columns = first_row.keys()

        # TODO: evaluate a better way of doing this
        column_descriptors = [{"title": column, "width": 20} for column in columns]
        name = renderer_context and renderer_context.get("export_sheet_name", "export")

        def get_row(item, **kwargs):
            return [item[col] for col in columns]

        buffer = generate_xlsx(
            sheet_name=name, columns=column_descriptors, queryset=chain([first_row], data_iterator), get_row=get_row
        )

        chunk_size = 8192
        while True:
            chunk = buffer.read(chunk_size)
            if not chunk:
                break
            yield chunk

        buffer.close()
