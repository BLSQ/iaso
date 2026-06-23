from django.contrib.auth.models import User
from django.test import override_settings
from django.urls import include, path, reverse
from rest_framework.pagination import PageNumberPagination
from rest_framework.routers import DefaultRouter
from rest_framework.test import APITestCase

from iaso.api.common import EtlModelViewset, EtlPaginator, ModelSerializer, Paginator


class SerializerUser(ModelSerializer):
    class Meta:
        model = User
        fields = ["id"]


class RandomPagination(EtlPaginator):
    page_size = 5


class RandomOtherPagination(PageNumberPagination):
    page_size = 5


class ViewSet(EtlModelViewset):
    pagination_class = RandomPagination
    queryset = User.objects.all()
    permission_classes = []
    serializer_class = SerializerUser
    results_key = "users"


class ViewSetWithoutPagination(EtlModelViewset):
    queryset = User.objects.all()
    permission_classes = []
    serializer_class = SerializerUser
    results_key = "users"


class ViewSetWithPaginationNotInheritedFromEtl(EtlModelViewset):
    queryset = User.objects.all()
    permission_classes = []
    serializer_class = SerializerUser
    results_key = "users"
    pagination_class = RandomOtherPagination


router = DefaultRouter()
router.register("test", ViewSet, basename="test")
router.register("test-default", ViewSetWithoutPagination, basename="test-default")
router.register("test-not-inherited", ViewSetWithPaginationNotInheritedFromEtl, basename="test-not-inherited")
urlpatterns = [
    path("", include(router.urls)),
]


@override_settings(ROOT_URLCONF=__name__)
class TestEtlModelViewset(APITestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        for i in range(10):
            User.objects.create(username=f"user-{i}", password=f"-{i}")

    def test_pagination_class(self):
        paginator_class = ViewSet().paginator
        self.assertIsInstance(paginator_class, RandomPagination)  # ok

    def test_default_applied(self):
        paginator_class = ViewSet().paginator
        self.assertIsInstance(paginator_class, Paginator)  # ok

    def test_results_key_in_pagination(self):
        res = self.client.get(reverse("test-list"))
        self.assertEqual(len(res.json()["users"]), 5)

    def test_results_key_in_default(self):
        res = self.client.get(reverse("test-default-list"))
        self.assertEqual(len(res.json()["users"]), 10)

    def test_no_error_raised_if_not_using_subclass_of_etl_paginator(self):
        with self.assertRaises(
            TypeError,
            msg=f"The pagination_class must be a subclass of EtlPaginator. Received: {RandomOtherPagination.__name__}.",
        ):
            self.client.get(reverse("test-not-inherited-list"))
