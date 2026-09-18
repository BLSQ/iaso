"""Strict query-param validation shared by v3 endpoints.

v3 endpoints reject unknown query parameters instead of silently ignoring them (django-filter's
default behaviour), and suggest the closest known param name(s) using the stdlib `difflib` module -
no fuzzy-matching dependency needed for typo-level suggestions.
"""

import difflib

from typing import Dict, Iterable, List


def suggest_close_matches(unknown_param: str, known_params: Iterable[str], max_suggestions: int = 3) -> List[str]:
    """Return up to `max_suggestions` known param names that look like `unknown_param`."""
    return difflib.get_close_matches(unknown_param, known_params, n=max_suggestions, cutoff=0.5)


def build_unsupported_params_error(unknown_params: Iterable[str], known_params: Iterable[str]) -> Dict:
    """Build the "unsupported query parameter" 400 payload.

    Same `{"error": ..., "detail": ...}` shape every other v3 400 uses (see `common/errors.py`), plus a
    `suggestions` key (`{unknown_param: [close matches, ...]}`) on top - structured data a caller can use
    directly instead of parsing it back out of `detail`."""
    known_params = sorted(known_params)
    unknown_params = sorted(unknown_params)
    suggestions = {}
    for param in unknown_params:
        matches = suggest_close_matches(param, known_params)
        if matches:
            suggestions[param] = matches
    detail = (
        "; ".join(f"{param!r}: did you mean {matches[0]!r}?" for param, matches in suggestions.items())
        or "No close match found among the known query parameters."
    )
    return {
        "error": f"Unsupported query parameter(s): {', '.join(unknown_params)}",
        "detail": detail,
        "suggestions": suggestions,
    }
