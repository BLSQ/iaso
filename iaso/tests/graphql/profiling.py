"""Counting the queries of a GraphQL request with `QueryProfiler`."""

import typing

from iaso.tests.utils.query_profiler import QueryProfiler


def profiled(run: typing.Callable[[], typing.Any]) -> typing.Tuple[QueryProfiler, typing.Any]:
    """`run()` once, then again under a `QueryProfiler`: the profiler and the second result. The first run loads what
    a request loads once per user object - kept by `force_authenticate` -, the permissions (`has_perm`) and the
    projects the user is restricted to (`Profile.projects_ids`): whether a request runs those depends on the
    requests before it, not on what it asks."""
    run()
    with QueryProfiler() as profiler:
        result = run()
    return profiler, result
