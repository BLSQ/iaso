from iaso.models import MetricType, MetricValue
from iaso.utils.workspace import find_active_workspace


REQUIRED_METRIC_VALUES_HEADERS = ["ADM1_NAME", "ADM2_NAME", "ADM2_ID"]


def get_missing_headers(df, expected_headers):
    file_headers = df.columns.values.tolist()
    return [header for header in expected_headers if header not in file_headers]


def get_org_unit_row(org_unit):
    """Returns the ADM1_NAME/ADM2_NAME/ADM2_ID columns shared by the CSV template and export."""
    return [org_unit.parent.name if org_unit.parent else "", org_unit.name, org_unit.id]


def get_visible_metric_types(request):
    """Metric types of the request's active workspace plus the account-wide ones; accounts without a workspace see all of theirs."""
    workspace = find_active_workspace(request)
    if workspace is not None:
        return MetricType.objects.visible_in_workspace(workspace)
    return MetricType.objects.filter(account=request.user.iaso_profile.account)


def get_visible_metric_values(request):
    return MetricValue.objects.filter(metric_type__in=get_visible_metric_types(request))
