import csv
from io import StringIO

from django.conf import settings
from django.db import connections
from django.http import HttpResponseForbidden, StreamingHttpResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_safe
from django_sql_dashboard.models import Dashboard
from django_sql_dashboard.utils import extract_named_parameters


# Changed to get to enable permalinking
@require_safe
def export_sql_results_for_dashboard(request, slug):
    """Export a saved SQL Dashboard as a file

    Parameters:
        * index: Which query from the dashboard to export
        * format: 'csv' or 'tsv'
    """
    if not getattr(settings, "DASHBOARD_ENABLE_FULL_EXPORT", None):
        return HttpResponseForbidden("The export feature is not enabled")
    ## copy pasted from the report, to extract
    dashboard = get_object_or_404(Dashboard, slug=slug)
    # Can current user see it, based on view_policy?
    view_policy = dashboard.view_policy
    owner = dashboard.owned_by
    denied = HttpResponseForbidden("You cannot access this dashboard")
    denied["cache-control"] = "private"
    if view_policy == Dashboard.ViewPolicies.PRIVATE:
        if request.user != owner:
            return denied
    elif view_policy == Dashboard.ViewPolicies.LOGGEDIN:
        if not request.user.is_authenticated:
            return denied
    elif view_policy == Dashboard.ViewPolicies.GROUP:
        if (not request.user.is_authenticated) or not (
            request.user == owner or request.user.groups.filter(pk=dashboard.view_group_id).exists()
        ):
            return denied
    elif view_policy == Dashboard.ViewPolicies.STAFF:
        if (not request.user.is_authenticated) or (request.user != owner and not request.user.is_staff):
            return denied
    elif view_policy == Dashboard.ViewPolicies.SUPERUSER:
        if (not request.user.is_authenticated) or (request.user != owner and not request.user.is_superuser):
            return denied

    format = request.GET.get("format", "csv")
    sql_index = request.GET.get("index", 1)
    assert format in ("csv", "tsv")  # TODO put nicer message

    dashboard_query = get_object_or_404(dashboard.queries, _order=sql_index)
    sql = dashboard_query.sql
    parameter_values = {parameter: request.GET.get(parameter, "") for parameter in extract_named_parameters(sql)}
    alias = getattr(settings, "DASHBOARD_DB_ALIAS", "dashboard")
    # Decide on filename
    filename = f"{dashboard.slug}_{sql_index}"
    filename_plus_ext = f"{filename}.{format}"

    connection = connections[alias]
    connection.cursor()  # To initialize connection
    cursor = connection.create_cursor(name="c" + filename.replace("-", "_"))

    csvfile = StringIO()
    csvwriter = csv.writer(
        csvfile,
        dialect={
            "csv": csv.excel,
            "tsv": csv.excel_tab,
        }[format],
    )

    def read_and_flush():
        csvfile.seek(0)
        data = csvfile.read()
        csvfile.seek(0)
        csvfile.truncate()
        return data

    def rows():
        try:
            cursor.execute(sql, parameter_values)
            done_header = False
            while True:
                records = cursor.fetchmany(size=2000)
                if not done_header:
                    csvwriter.writerow([r.name for r in cursor.description])
                    yield read_and_flush()
                    done_header = True
                if not records:
                    break
                for record in records:
                    csvwriter.writerow(record)
                    yield read_and_flush()
        finally:
            cursor.close()

    response = StreamingHttpResponse(
        rows(),
        content_type={
            "csv": "text/csv",
            "tsv": "text/tab-separated-values",
        }[format],
    )
    response["Content-Disposition"] = 'attachment; filename="' + filename_plus_ext + '"'
    return response
