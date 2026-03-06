REQUIRED_METRIC_VALUES_HEADERS = ["ADM1_NAME", "ADM2_NAME", "ADM2_ID"]


def get_missing_headers(df, expected_headers):
    file_headers = df.columns.values.tolist()
    return [header for header in expected_headers if header not in file_headers]
