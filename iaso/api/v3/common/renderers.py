"""Minimal DRF renderers so `?format=xlsx`/`?format=parquet` negotiate successfully.

JSON and CSV are already covered by the project's global `DEFAULT_RENDERER_CLASSES` (see
`hat/settings.py`). These two are intentionally "dumb": the view never actually calls `.render()` on
them - it short-circuits and returns a raw `HttpResponse`/`StreamingHttpResponse`/`FileResponse` before
DRF's response-rendering step. They only exist so `rest_framework`'s content negotiation (triggered by the
`format` query param, see `APIView.perform_content_negotiation`) recognizes `xlsx`/`parquet` as valid
formats instead of returning `406 Not Acceptable`.
"""

from rest_framework.renderers import BaseRenderer


class XLSXRenderer(BaseRenderer):
    media_type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    format = "xlsx"
    charset = None
    render_style = "binary"

    def render(self, data, accepted_media_type=None, renderer_context=None):
        return data


class ParquetRenderer(BaseRenderer):
    media_type = "application/octet-stream"
    format = "parquet"
    charset = None
    render_style = "binary"

    def render(self, data, accepted_media_type=None, renderer_context=None):
        return data
