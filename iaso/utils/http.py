from functools import wraps

from django.conf import settings
from django.http import HttpResponse


def set_frame_ancestors_csp(response: HttpResponse, extra_origins=()) -> HttpResponse:
    """Set Content-Security-Policy: frame-ancestors on the response, allowing embedding
    in an <iframe> only from 'self' and the given extra origins.

    Meant to be combined with django's xframe_options_exempt, which removes the default
    X-Frame-Options: DENY so this CSP header is what actually restricts framing.
    """
    ancestors = " ".join(["'self'", *extra_origins])
    response["Content-Security-Policy"] = f"frame-ancestors {ancestors}"
    return response


def frame_ancestors_csp(view_func):
    """Decorator applying set_frame_ancestors_csp with settings.EMBED_FRAME_ANCESTORS as the
    allowed extra origins."""

    @wraps(view_func)
    def wrapped_view(request, *args, **kwargs):
        response = view_func(request, *args, **kwargs)
        return set_frame_ancestors_csp(response, settings.EMBED_FRAME_ANCESTORS)

    return wrapped_view
