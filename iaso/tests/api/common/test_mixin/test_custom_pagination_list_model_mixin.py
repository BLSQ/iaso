from django.contrib.auth.models import User
from django.test import override_settings
from django.urls import include, path, reverse
from rest_framework.routers import DefaultRouter
from rest_framework.test import APITestCase
from rest_framework.viewsets import GenericViewSet

from iaso.api.common import ModelSerializer, Paginator
from iaso.api.common.mixin import CustomPaginationListModelMixin


class SerializerUser(ModelSerializer):
    class Meta:
        model = User
        fields = ["id"]


class RandomPagination(Paginator):
    page_size = 5


class ViewSet(CustomPaginationListModelMixin, GenericViewSet):
    pagination_class = RandomPagination
    queryset = User.objects.all()
    permission_classes = []
    serializer_class = SerializerUser
    results_key = "users"


class ViewSetRemoveResultsIfNotPaginated(CustomPaginationListModelMixin, GenericViewSet):
    pagination_class = Paginator
    queryset = User.objects.all()
    permission_classes = []
    serializer_class = SerializerUser
    results_key = "users"
    include_results_key_if_not_paginated = False


class ViewSetWithoutPagination(CustomPaginationListModelMixin, GenericViewSet):
    queryset = User.objects.all()
    permission_classes = []
    serializer_class = SerializerUser
    results_key = "users"


class ViewSetResultsKeyNone(CustomPaginationListModelMixin, GenericViewSet):
    queryset = User.objects.all()
    permission_classes = []
    serializer_class = SerializerUser
    results_key = None


class ViewSetResultsKeyNoneAndPaginationNone(ViewSetResultsKeyNone):
    pagination_class = None


class ViewSetWithDefaults(CustomPaginationListModelMixin, GenericViewSet):
    queryset = User.objects.all()
    permission_classes = []
    serializer_class = SerializerUser


router = DefaultRouter()
router.register("test", ViewSet, basename="test")
router.register("test-with-all-defaults", ViewSetWithDefaults, basename="test-with-all-defaults")
router.register("test-remove-results", ViewSetRemoveResultsIfNotPaginated, basename="test-remove-results")
router.register("test-default", ViewSetWithoutPagination, basename="test-default")
router.register("test-no-results-key", ViewSetResultsKeyNone, basename="test-no-results-key")
router.register(
    "test-no-results-key-no-pagination",
    ViewSetResultsKeyNoneAndPaginationNone,
    basename="test-no-results-key-no-pagination",
)
urlpatterns = [
    path("", include(router.urls)),
]


@override_settings(ROOT_URLCONF=__name__)
class TestCustomListModelPaginationMixin(APITestCase):
    @classmethod
    def setUpTestData(cls):
        for i in range(10):
            User.objects.create(username=f"user-{i}", password=f"-{i}")

    def test_pagination_class(self):
        paginator_class = ViewSet().paginator
        self.assertIsInstance(paginator_class, RandomPagination)
        self.assertIsInstance(paginator_class, Paginator)

    def test_default_applied(self):
        paginator_class = ViewSetWithoutPagination().paginator
        self.assertIsInstance(paginator_class, Paginator)

        paginator_class = ViewSetWithDefaults().paginator
        self.assertIs(paginator_class.__class__, Paginator)

    def test_results_key_in_pagination(self):
        res = self.client.get(reverse("test-list"))
        self.assertEqual(len(res.json()["users"]), 5)

    def test_results_key_in_default(self):
        res = self.client.get(reverse("test-default-list"))
        self.assertEqual(len(res.json()["users"]), 10)
        self.assertIn("users", res.json())

    def test_results_key_is_removed_if_not_paginated(self):
        res = self.client.get(reverse("test-remove-results-list"))
        self.assertNotIn("users", res.json())

        res = self.client.get(reverse("test-remove-results-list"), data={"limit": 1000})
        self.assertIn("users", res.json())

    def test_error_if_results_key_is_not_set(self):
        # message raised from the paginator
        with self.assertRaises(ValueError, msg="ViewSetResultsKeyNone should define a results_key attribute"):
            self.client.get(reverse("test-no-results-key-list"))

        # message raised from the get_results_key in mixin
        with self.assertRaises(ValueError, msg="ViewSetResultsKeyNone should define a results_key attribute"):
            self.client.get(reverse("test-no-results-key-no-pagination-list"))

    def test_viewset_all_default(self):
        res = self.client.get(reverse("test-with-all-defaults-list"))
        self.assertIn("results", res.json())
