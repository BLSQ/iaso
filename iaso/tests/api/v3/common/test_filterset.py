from django.test import SimpleTestCase
from django_filters import rest_framework as django_filters
from rest_framework.exceptions import ValidationError

from iaso.api.v3.common.filterset import CORE_EXTRA_ALLOWED_PARAMS, BaseV3FilterSet
from iaso.models import OrgUnit


class _WithoutExtraParams(BaseV3FilterSet):
    name = django_filters.CharFilter()


class _WithExtraParams(BaseV3FilterSet):
    extra_allowed_params = frozenset({"search"})
    renamed_params = {"title": "name"}

    name = django_filters.CharFilter()


class BaseV3FilterSetTestCase(SimpleTestCase):
    def test_declared_filters_are_accepted(self):
        _WithoutExtraParams(queryset=OrgUnit.objects.none(), data={"name": "x"})

    def test_no_data_skips_the_check(self):
        _WithoutExtraParams(queryset=OrgUnit.objects.none(), data=None)

    def test_unknown_param_is_rejected_with_suggestions(self):
        with self.assertRaises(ValidationError) as ctx:
            _WithoutExtraParams(queryset=OrgUnit.objects.none(), data={"nme": "x"})
        self.assertIn("nme", str(ctx.exception.detail["error"]))
        self.assertEqual(ctx.exception.detail["suggestions"]["nme"], ["name"])

    def test_extra_allowed_params_are_accepted_only_where_declared(self):
        _WithExtraParams(queryset=OrgUnit.objects.none(), data={"search": "x", "name": "y"})
        with self.assertRaises(ValidationError):
            _WithoutExtraParams(queryset=OrgUnit.objects.none(), data={"search": "x"})

    def test_shared_core_params_are_always_accepted(self):
        _WithoutExtraParams(queryset=OrgUnit.objects.none(), data={param: "1" for param in CORE_EXTRA_ALLOWED_PARAMS})

    def test_known_params(self):
        self.assertEqual(_WithoutExtraParams.known_params(), {"name"} | CORE_EXTRA_ALLOWED_PARAMS)
        self.assertEqual(_WithExtraParams.known_params(), {"name", "search"} | CORE_EXTRA_ALLOWED_PARAMS)

    def test_renamed_param_is_rejected_with_its_new_name(self):
        with self.assertRaises(ValidationError) as ctx:
            _WithExtraParams(queryset=OrgUnit.objects.none(), data={"title": "x"})
        self.assertEqual(ctx.exception.detail["detail"], "'title' was renamed to 'name'")
        self.assertEqual(ctx.exception.detail["suggestions"], {"title": ["name"]})
