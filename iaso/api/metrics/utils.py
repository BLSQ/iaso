REQUIRED_METRIC_VALUES_HEADERS = ["ADM1_NAME", "ADM2_NAME", "ADM2_ID"]


def get_missing_headers(df, expected_headers):
    file_headers = df.columns.values.tolist()
    return [header for header in expected_headers if header not in file_headers]


def get_org_unit_row(org_unit):
    """Returns the ADM1_NAME/ADM2_NAME/ADM2_ID columns shared by the CSV template and export."""
    return [org_unit.parent.name if org_unit.parent else "", org_unit.name, org_unit.id]
