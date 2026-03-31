from django.test import TestCase
from rest_framework.pagination import LimitOffsetPagination

from iaso.api.common import EtlModelViewset, EtlPaginator


class ValidCustomPaginator(EtlPaginator):
    default_limit = 20


class InvalidPaginator(LimitOffsetPagination):
    pass


class TestEnforcedPaginatorModelViewSet(TestCase):
    def test_default_pagination_class_is_etl_paginator(self):
        """When no pagination_class override is set, EtlPaginator is used."""

        class DefaultViewSet(EtlModelViewset):
            pass

        viewset = DefaultViewSet()
        pagination_class = viewset.get_pagination_class()
        self.assertEqual(pagination_class, EtlPaginator)

    def test_accepts_etl_paginator_subclass(self):
        """A subclass of EtlPaginator is accepted as a valid override."""

        class CustomViewSet(EtlModelViewset):
            pagination_class = ValidCustomPaginator

        viewset = CustomViewSet()
        pagination_class = viewset.get_pagination_class()
        self.assertEqual(pagination_class, ValidCustomPaginator)

    def test_rejects_non_etl_paginator_subclass(self):
        """A pagination_class that doesn't inherit from EtlPaginator raises TypeError."""

        class InvalidViewSet(EtlModelViewset):
            pagination_class = InvalidPaginator

        with self.assertRaises(TypeError) as err:
            InvalidViewSet().get_pagination_class()

        self.assertIn(EtlPaginator.__name__, str(err.exception))
        self.assertIn(InvalidPaginator.__name__, str(err.exception))
