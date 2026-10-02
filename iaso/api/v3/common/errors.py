"""Shared error-response shape for v3 endpoints.

Every 400 a v3 endpoint raises serializes as a JSON object with (at least) two keys:
- `error`: a short, one-line summary of what's wrong.
- `detail`: more specific guidance - what's allowed, or how to fix it.

Never a bare string: DRF wraps a bare-string `ValidationError` in a plain list (`["..."]`) instead, which
callers can't key off of the same way as `response.json()["error"]`. Build every v3 400 with
`bad_request()` instead of writing the dict literal at the call site, so the shape can't drift.
"""

from rest_framework.exceptions import ValidationError


def bad_request(error: str, detail: str = "") -> ValidationError:
    return ValidationError({"error": error, "detail": detail})
