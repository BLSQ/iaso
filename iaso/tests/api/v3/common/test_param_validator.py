from django.test import SimpleTestCase

from iaso.api.v3.common.param_validator import build_unsupported_params_error, suggest_close_matches


KNOWN = ["name", "name__icontains", "source_ref", "created_at__gte"]


class SuggestCloseMatchesTestCase(SimpleTestCase):
    def test_typo(self):
        self.assertEqual(suggest_close_matches("source_reff", KNOWN)[0], "source_ref")

    def test_no_close_match(self):
        self.assertEqual(suggest_close_matches("dateFrom", KNOWN), [])

    def test_max_suggestions(self):
        self.assertLessEqual(len(suggest_close_matches("nam", KNOWN, max_suggestions=1)), 1)


class BuildUnsupportedParamsErrorTestCase(SimpleTestCase):
    def test_suggestions_and_detail(self):
        error = build_unsupported_params_error(["source_reff", "dateFrom"], KNOWN)
        self.assertEqual(error["error"], "Unsupported query parameter(s): dateFrom, source_reff")
        self.assertEqual(error["detail"], "'source_reff': did you mean 'source_ref'?")
        self.assertEqual(list(error["suggestions"]), ["source_reff"])

    def test_without_any_close_match(self):
        error = build_unsupported_params_error(["dateFrom"], KNOWN)
        self.assertEqual(error["detail"], "No close match found among the known query parameters.")
        self.assertEqual(error["suggestions"], {})

    def test_renamed_param_wins_over_difflib(self):
        error = build_unsupported_params_error(["label", "source_reff"], KNOWN, {"label": "name"})
        self.assertEqual(error["suggestions"]["label"], ["name"])
        self.assertEqual(error["detail"], "'label' was renamed to 'name'; 'source_reff': did you mean 'source_ref'?")
