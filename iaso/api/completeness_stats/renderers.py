from collections import OrderedDict

import rest_framework_csv.renderers


class CompletenessStatsCSVRenderer(rest_framework_csv.renderers.CSVRenderer):
    """Custom CSV renderer for completeness stats that properly formats form data"""

    def render(self, data, accepted_media_type=None, renderer_context=None):
        if not data or not isinstance(data, dict):
            return super().render(data, accepted_media_type, renderer_context)

        # Handle paginated response
        if "results" in data:
            results = data["results"]
            forms = data.get("forms", [])
        else:
            results = data
            forms = []

        if not results:
            return super().render(data, accepted_media_type, renderer_context)

        # Build the header in the desired order
        header = ["id", "org_unit_name", "org_unit_type_name", "parent_org_unit_name"]

        # Add form-specific columns to the header
        for form in forms:
            form_name = form.get("name", "")
            header.extend(
                [
                    f"{form_name} - Direct",
                    f"{form_name} - Descendants Numerator",
                    f"{form_name} - Descendants Denominator",
                    f"{form_name} - Descendants Percentage",
                ]
            )

        transformed_data = []

        for row in results:
            # Start with base columns for better user experience
            transformed_row = OrderedDict(
                [
                    ("id", row.get("id", "")),
                    ("org_unit_name", row.get("org_unit", {}).get("name", "") if row.get("org_unit") else ""),
                    (
                        "org_unit_type_name",
                        row.get("org_unit_type", {}).get("name", "") if row.get("org_unit_type") else "",
                    ),
                    (
                        "parent_org_unit_name",
                        row.get("parent_org_unit", {}).get("name", "") if row.get("parent_org_unit") else "",
                    ),
                ]
            )

            # Add form-specific columns after the base columns
            form_stats = row.get("form_stats", {})
            for form in forms:
                form_slug = form.get("slug", "")
                form_name = form.get("name", "")
                form_stats_data = form_stats.get(form_slug, {})

                descendants = form_stats_data.get("descendants", 0)
                descendants_ok = form_stats_data.get("descendants_ok", 0)
                itself_target = form_stats_data.get("itself_target", 0)
                itself_has_instances = form_stats_data.get("itself_has_instances", 0)
                percent = form_stats_data.get("percent", 0)

                # If the form doesn't apply to this org unit (no descendants and not itself targeted), show N/A
                if descendants == 0 and itself_target == 0:
                    transformed_row[f"{form_name} - Direct"] = "N/A"
                    transformed_row[f"{form_name} - Descendants Numerator"] = "N/A"
                    transformed_row[f"{form_name} - Descendants Denominator"] = "N/A"
                    transformed_row[f"{form_name} - Descendants Percentage"] = "N/A"
                else:
                    # Direct logic:
                    # - itself_target = 0 => N/A
                    # - itself_target = 1 and itself_has_instances = 0 => false
                    # - itself_target = 1 and itself_has_instances = 1 => true
                    if itself_target == 0:
                        transformed_row[f"{form_name} - Direct"] = "N/A"
                    elif itself_target == 1 and itself_has_instances == 0:
                        transformed_row[f"{form_name} - Direct"] = "false"
                    elif itself_target == 1 and itself_has_instances == 1:
                        transformed_row[f"{form_name} - Direct"] = "true"
                    else:
                        # Fallback for unexpected values
                        transformed_row[f"{form_name} - Direct"] = "N/A"

                    transformed_row[f"{form_name} - Descendants Numerator"] = descendants_ok
                    transformed_row[f"{form_name} - Descendants Denominator"] = descendants
                    transformed_row[f"{form_name} - Descendants Percentage"] = percent

            transformed_data.append(transformed_row)

        # Set the header to control column order
        self.header = header

        return super().render(transformed_data, accepted_media_type, renderer_context)
