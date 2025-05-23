from django.test import TestCase
from rest_framework.pagination import LimitOffsetPagination

from iaso.api.common import EtlModelViewset, EtlPaginator


# Dummy paginator classes
class ValidCustomPaginator(EtlPaginator):
    default_limit = 20


class InvalidPaginator(LimitOffsetPagination):  # Not inheriting from EtlPaginator
    pass


# Dummy ViewSet using the enforced paginator
class TestViewSet(EtlModelViewset):
    pass


class TestEnforcedPaginatorModelViewSet(TestCase):
    def test_default_pagination_class(self):
        """Test that the default pagination_class is used."""
        viewset = TestViewSet()
        pagination_class = viewset.get_pagination_class()
        self.assertTrue(issubclass(pagination_class, EtlPaginator))

    def test_valid_custom_pagination_class(self):
        """Test that a valid custom pagination_class is accepted."""

        class CustomViewSet(EtlModelViewset):
            pagination_class = ValidCustomPaginator

        viewset = CustomViewSet()
        pagination_class = viewset.get_pagination_class()
        self.assertEqual(pagination_class, ValidCustomPaginator)

    def test_invalid_pagination_class(self):
        """Test that an invalid pagination_class raises a TypeError."""

        class InvalidViewSet(EtlModelViewset):
            pagination_class = InvalidPaginator

        with self.assertRaises(TypeError) as err:
            InvalidViewSet().get_pagination_class()

        self.assertEqual(
            str(err.exception),
            f"The pagination_class must be a subclass of {EtlPaginator.__name__}. "
            f"Received: {InvalidPaginator.__name__}.",
        )
