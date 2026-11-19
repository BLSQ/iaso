"""
Purpose of this test file is to also show the benefits of using our related fields and list serializers compared to classic DRF ones
Ofc this test would fail if DRF fixes is stuff internally, hence you'll know that it's time to get rid of those fields and use the classic ones

"""

from typing import Any

from django.test import override_settings
from django.urls import reverse
from rest_framework import routers, serializers, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.serializers import BaseSerializer
from rest_framework.viewsets import GenericViewSet

from iaso.api.common import ModelSerializer
from iaso.api.common.serializer import ListQueryOptimizedSerializer
from iaso.api.common.serializer_fields import IasoPrimaryKeyRelatedField, IasoSlugRelatedField
from iaso.test import APITestCase
from iaso.tests.models import OtherTestNestedModel, TestModelForListQueryOptimizedSerializer, TestNestedModel


# setup the serializers
class ClassicDRFPkSerializer(ModelSerializer):
    nested = serializers.PrimaryKeyRelatedField(
        allow_null=True, write_only=True, required=False, queryset=TestNestedModel.objects.all()
    )
    many_nested = serializers.PrimaryKeyRelatedField(
        many=True,
        allow_null=True,
        allow_empty=True,
        write_only=True,
        required=False,
        queryset=OtherTestNestedModel.objects.all(),
    )

    class Meta:
        model = TestModelForListQueryOptimizedSerializer
        fields = ("nested", "many_nested")


class OptimizedDRFPkSerializer(ModelSerializer):
    nested = IasoPrimaryKeyRelatedField(
        allow_null=True, write_only=True, required=False, queryset=TestNestedModel.objects.all()
    )
    many_nested = IasoPrimaryKeyRelatedField(
        many=True,
        allow_null=True,
        allow_empty=True,
        write_only=True,
        required=False,
        queryset=OtherTestNestedModel.objects.all(),
    )

    class Meta:
        model = TestModelForListQueryOptimizedSerializer
        fields = ("nested", "many_nested")


class ClassicDRFPkOptimizedListSerializer(ClassicDRFPkSerializer):
    class Meta(ClassicDRFPkSerializer.Meta):
        list_serializer_class = ListQueryOptimizedSerializer


class OptimizedDRFPkOptimizedListSerializer(OptimizedDRFPkSerializer):
    class Meta(OptimizedDRFPkSerializer.Meta):
        list_serializer_class = ListQueryOptimizedSerializer


class ClassicDRFSlugSerializer(ModelSerializer):
    nested = serializers.SlugRelatedField(
        slug_field="name", allow_null=True, write_only=True, required=False, queryset=TestNestedModel.objects.all()
    )
    many_nested = serializers.SlugRelatedField(
        slug_field="name",
        many=True,
        allow_null=True,
        allow_empty=True,
        write_only=True,
        required=False,
        queryset=OtherTestNestedModel.objects.all(),
    )

    class Meta:
        model = TestModelForListQueryOptimizedSerializer
        fields = ("nested", "many_nested")


class OptimizedDRFSlugSerializer(ModelSerializer):
    nested = IasoSlugRelatedField(
        slug_field="name", allow_null=True, write_only=True, required=False, queryset=TestNestedModel.objects.all()
    )
    many_nested = IasoSlugRelatedField(
        slug_field="name",
        many=True,
        allow_null=True,
        allow_empty=True,
        write_only=True,
        required=False,
        queryset=OtherTestNestedModel.objects.all(),
    )

    class Meta:
        model = TestModelForListQueryOptimizedSerializer
        fields = ("nested", "many_nested")


class ClassicDRFSlugOptimizedListSerializer(ClassicDRFSlugSerializer):
    class Meta(ClassicDRFPkSerializer.Meta):
        list_serializer_class = ListQueryOptimizedSerializer


class OptimizedDRFSlugOptimizedListSerializer(OptimizedDRFSlugSerializer):
    class Meta(OptimizedDRFPkSerializer.Meta):
        list_serializer_class = ListQueryOptimizedSerializer


# setup the views


class TestPKRelatedViewSet(GenericViewSet):
    authentication_classes = []
    permission_classes = []
    queryset = TestModelForListQueryOptimizedSerializer.objects.all()

    def get_serializer_class(self) -> type[BaseSerializer]:
        serializers_by_action = {
            "create_single_classic_drf_pk_serializer": ClassicDRFPkSerializer,
            "create_single_optimized_drf_pk_serializer": OptimizedDRFPkSerializer,
            "create_multiple_classic_drf_pk_serializers_with_classic_list_serializer": ClassicDRFPkSerializer,
            "create_multiple_optimized_drf_pk_serializers_with_classic_list_serializer": OptimizedDRFPkSerializer,
            "create_multiple_classic_drf_pk_serializers_with_optimized_list_serializer": ClassicDRFPkOptimizedListSerializer,
            "create_multiple_optimized_drf_pk_serializers_with_optimized_list_serializer": OptimizedDRFPkOptimizedListSerializer,
        }
        return serializers_by_action[self.action]

    def _create(self, request, many=False, *args, **kwargs) -> Response:
        serializer = self.get_serializer(data=request.data, many=many)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["post"], url_path="single-classic", url_name="single-classic")
    def create_single_classic_drf_pk_serializer(self, request, *args, **kwargs):
        return self._create(request, *args, **kwargs)

    @action(detail=False, methods=["post"], url_path="single-optimized", url_name="single-optimized")
    def create_single_optimized_drf_pk_serializer(self, request, *args, **kwargs):
        return self._create(request, *args, **kwargs)

    @action(
        detail=False,
        methods=["post"],
        url_path="multiple-classic-list-classic",
        url_name="multiple-classic-list-classic",
    )
    def create_multiple_classic_drf_pk_serializers_with_classic_list_serializer(self, request, *args, **kwargs):
        return self._create(request, True, *args, **kwargs)

    @action(
        detail=False,
        methods=["post"],
        url_path="multiple-optimized-list-classic",
        url_name="multiple-optimized-list-classic",
    )
    def create_multiple_optimized_drf_pk_serializers_with_classic_list_serializer(self, request, *args, **kwargs):
        return self._create(request, True, *args, **kwargs)

    @action(
        detail=False,
        methods=["post"],
        url_path="multiple-classic-list-optimized",
        url_name="multiple-classic-list-optimized",
    )
    def create_multiple_classic_drf_pk_serializers_with_optimized_list_serializer(self, request, *args, **kwargs):
        return self._create(request, True, *args, **kwargs)

    @action(
        detail=False,
        methods=["post"],
        url_path="multiple-optimized-list-optimized",
        url_name="multiple-optimized-list-optimized",
    )
    def create_multiple_optimized_drf_pk_serializers_with_optimized_list_serializer(self, request, *args, **kwargs):
        return self._create(request, True, *args, **kwargs)


class TestSlugRelatedViewSet(GenericViewSet):
    authentication_classes = []
    permission_classes = []
    queryset = TestModelForListQueryOptimizedSerializer.objects.all()

    def get_serializer_class(self) -> type[BaseSerializer]:
        serializers_by_action = {
            "create_single_classic_drf_slug_serializer": ClassicDRFSlugSerializer,
            "create_single_optimized_drf_slug_serializer": OptimizedDRFSlugSerializer,
            "create_multiple_classic_drf_slug_serializers_with_classic_list_serializer": ClassicDRFSlugSerializer,
            "create_multiple_optimized_drf_slug_serializers_with_classic_list_serializer": OptimizedDRFSlugSerializer,
            "create_multiple_classic_drf_slug_serializers_with_optimized_list_serializer": ClassicDRFSlugOptimizedListSerializer,
            "create_multiple_optimized_drf_slug_serializers_with_optimized_list_serializer": OptimizedDRFSlugOptimizedListSerializer,
        }
        return serializers_by_action[self.action]

    def _create(self, request, many=False, *args, **kwargs) -> Response:
        serializer = self.get_serializer(data=request.data, many=many)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["post"], url_path="single-classic", url_name="single-classic")
    def create_single_classic_drf_slug_serializer(self, request, *args, **kwargs):
        return self._create(request, *args, **kwargs)

    @action(detail=False, methods=["post"], url_path="single-optimized", url_name="single-optimized")
    def create_single_optimized_drf_slug_serializer(self, request, *args, **kwargs):
        return self._create(request, *args, **kwargs)

    @action(
        detail=False,
        methods=["post"],
        url_path="multiple-classic-list-classic",
        url_name="multiple-classic-list-classic",
    )
    def create_multiple_classic_drf_slug_serializers_with_classic_list_serializer(self, request, *args, **kwargs):
        return self._create(request, True, *args, **kwargs)

    @action(
        detail=False,
        methods=["post"],
        url_path="multiple-optimized-list-classic",
        url_name="multiple-optimized-list-classic",
    )
    def create_multiple_optimized_drf_slug_serializers_with_classic_list_serializer(self, request, *args, **kwargs):
        return self._create(request, True, *args, **kwargs)

    @action(
        detail=False,
        methods=["post"],
        url_path="multiple-classic-list-optimized",
        url_name="multiple-classic-list-optimized",
    )
    def create_multiple_classic_drf_slug_serializers_with_optimized_list_serializer(self, request, *args, **kwargs):
        return self._create(request, True, *args, **kwargs)

    @action(
        detail=False,
        methods=["post"],
        url_path="multiple-optimized-list-optimized",
        url_name="multiple-optimized-list-optimized",
    )
    def create_multiple_optimized_drf_slug_serializers_with_optimized_list_serializer(self, request, *args, **kwargs):
        return self._create(request, True, *args, **kwargs)


router = routers.DefaultRouter()
router.register("pk-related", TestPKRelatedViewSet, "pk_related")
router.register("slug-related", TestSlugRelatedViewSet, "slug_related")


class UrlPattern:
    urlpatterns = router.urls


@override_settings(ROOT_URLCONF=UrlPattern)
class TestIasoPkRelatedField(APITestCase):
    @classmethod
    def setUpTestData(cls) -> None:
        cls.nested_1 = TestNestedModel.objects.create(name="Nested 1")
        cls.nested_2 = TestNestedModel.objects.create(name="Nested 2")
        cls.many_nested_1 = OtherTestNestedModel.objects.create(name="Many Nested 1")
        cls.many_nested_2 = OtherTestNestedModel.objects.create(name="Many Nested 2")
        cls.many_nested_3 = OtherTestNestedModel.objects.create(name="Many Nested 3")
        cls.many_nested_4 = OtherTestNestedModel.objects.create(name="Many Nested 4")

        cls.single_payload = {
            "nested": cls.nested_1.pk,
            "many_nested": [cls.many_nested_1.pk, cls.many_nested_2.pk],
        }

        cls.multiple_payload = [
            {
                "nested": cls.nested_1.pk,
                "many_nested": [cls.many_nested_1.pk, cls.many_nested_2.pk],
            },
            {
                "nested": cls.nested_2.pk,
                "many_nested": [cls.many_nested_3.pk, cls.many_nested_4.pk],
            },
        ]

    def post(self, action_name: str, data: Any):
        url = reverse(f"pk_related-{action_name}")
        return self.client.post(url, data)

    def test_single_does_not_crash_in_case_of_empty_or_null_values(self):
        payload = {
            "nested": None,
            "many_nested": [],
        }

        for action_name in (
            "single-classic",
            "single-optimized",
        ):
            with self.subTest(action=action_name):
                response = self.post(action_name, payload)
                self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_multiple_does_not_crash_in_case_of_empty_or_null_values(self):
        payload = [
            {
                "nested": None,
                "many_nested": [],
            },
            {
                "nested": None,
                "many_nested": [],
            },
        ]

        for action_name in (
            "multiple-classic-list-classic",
            "multiple-optimized-list-classic",
            "multiple-classic-list-optimized",
            "multiple-optimized-list-optimized",
        ):
            with self.subTest(action=action_name):
                response = self.post(action_name, payload)
                self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_validation_for_single_still_happens_with_custom_fields(self):
        with self.subTest("not many"):
            pk = TestNestedModel.objects.order_by("-pk").first().pk + 1
            payload = {"nested": pk, "many_nested": []}

            res = self.post(
                "single-optimized",
                data=payload,
            )
            res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
            self.assertHasError(res_data, "nested", f'Invalid pk "{pk}" - object does not exist.')

        with self.subTest("many"):
            pk = OtherTestNestedModel.objects.order_by("-pk").first().pk + 1
            payload = {"nested": None, "many_nested": [pk]}

            res = self.post(
                "single-optimized",
                data=payload,
            )
            res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
            self.assertHasError(res_data, "many_nested", f'Invalid pk "{pk}" - object does not exist.')

    def test_validation_for_multiple_still_happens(self):
        for action_name in (
            "multiple-optimized-list-classic",
            "multiple-classic-list-optimized",
            "multiple-optimized-list-optimized",
        ):
            with self.subTest(action=action_name):
                with self.subTest("nested"):
                    pk = TestNestedModel.objects.order_by("-pk").first().pk + 1
                    payload = [{"nested": pk, "many_nested": []}]

                    res = self.post(
                        action_name,
                        data=payload,
                    )
                    res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
                    self.assertEqual(res_data, [{"nested": [f'Invalid pk "{pk}" - object does not exist.']}])

                with self.subTest("many nested"):
                    pk = OtherTestNestedModel.objects.order_by("-pk").first().pk + 1
                    payload = [{"nested": None, "many_nested": [pk]}]

                    res = self.post(
                        action_name,
                        data=payload,
                    )
                    res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
                    self.assertEqual(res_data, [{"many_nested": [f'Invalid pk "{pk}" - object does not exist.']}])

    def test_num_queries(self):
        expected_queries = {
            # 1 for FK validation
            # 2 for m2m validation,
            # 1 for create instance
            # 2 for create m2m (one select and one insert)
            "single-classic": 6,
            # 1 for FK validation
            # 1 for m2m validation
            # 1 for create instance
            # 2 for create m2m (one select and one insert)
            "single-optimized": 5,
            # 1 for FK validation first item
            # 2 for M2M validation multiple item
            # 1 for FK validation second item
            # 2 for M2M validation second item
            # 2 for create instance
            # 4 for create m2m (two select and two inserts)
            "multiple-classic-list-classic": 12,
            # 1 for FK validation first item
            # 1 for M2M validation multiple item
            # 1 for FK validation second item
            # 1 for M2M validation second item
            # 2 for create instance
            # 4 for create m2m (two select and two inserts)
            "multiple-optimized-list-classic": 10,
            # 1 for FK validation - all items
            # 1 for M2M validation - all items
            # 2 for create instance
            # 4 for create m2m (two select and two inserts)
            "multiple-classic-list-optimized": 8,
            # same as above actually as the custom list serializer replaces pk fields
            # 1 for FK validation - all items
            # 1 for M2M validation - all items
            # 2 for create instance
            # 4 for create m2m (two select and two inserts)
            "multiple-optimized-list-optimized": 8,
        }

        for action_name, expected in expected_queries.items():
            with self.subTest(action=action_name):
                with self.assertNumQueries(expected):
                    res = self.post(
                        action_name, self.single_payload if action_name.startswith("single-") else self.multiple_payload
                    )
                    self.assertEqual(res.status_code, status.HTTP_201_CREATED)


@override_settings(ROOT_URLCONF=UrlPattern)
class TestIasoSlugRelatedField(APITestCase):
    @classmethod
    def setUpTestData(cls) -> None:
        cls.nested_1 = TestNestedModel.objects.create(name="Nested 1")
        cls.nested_2 = TestNestedModel.objects.create(name="Nested 2")
        cls.many_nested_1 = OtherTestNestedModel.objects.create(name="Many Nested 1")
        cls.many_nested_2 = OtherTestNestedModel.objects.create(name="Many Nested 2")
        cls.many_nested_3 = OtherTestNestedModel.objects.create(name="Many Nested 3")
        cls.many_nested_4 = OtherTestNestedModel.objects.create(name="Many Nested 4")

        cls.single_payload = {
            "nested": cls.nested_1.name,
            "many_nested": [cls.many_nested_1.name, cls.many_nested_2.name],
        }

        cls.multiple_payload = [
            {
                "nested": cls.nested_1.name,
                "many_nested": [cls.many_nested_1.name, cls.many_nested_2.name],
            },
            {
                "nested": cls.nested_2.name,
                "many_nested": [cls.many_nested_3.name, cls.many_nested_4.name],
            },
        ]

    def post(self, action_name: str, data: Any):
        url = reverse(f"slug_related-{action_name}")
        return self.client.post(url, data)

    def test_single_does_not_crash_in_case_of_empty_or_null_values(self):
        payload = {
            "nested": None,
            "many_nested": [],
        }

        for action_name in (
            "single-classic",
            "single-optimized",
        ):
            with self.subTest(action=action_name):
                response = self.post(action_name, payload)
                self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_multiple_does_not_crash_in_case_of_empty_or_null_values(self):
        payload = [
            {
                "nested": None,
                "many_nested": [],
            },
            {
                "nested": None,
                "many_nested": [],
            },
        ]

        for action_name in (
            "multiple-classic-list-classic",
            "multiple-optimized-list-classic",
            "multiple-classic-list-optimized",
            "multiple-optimized-list-optimized",
        ):
            with self.subTest(action=action_name):
                response = self.post(action_name, payload)
                self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_validation_for_single_still_happens_with_custom_fields(self):
        with self.subTest("not many"):
            name = "wrong"
            payload = {"nested": name, "many_nested": []}

            res = self.post(
                "single-optimized",
                data=payload,
            )
            res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
            self.assertHasError(res_data, "nested", "Object with name=wrong does not exist.")

        with self.subTest("many"):
            name = "wrong"
            payload = {"nested": None, "many_nested": [name]}

            res = self.post(
                "single-optimized",
                data=payload,
            )
            res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
            self.assertHasError(res_data, "many_nested", "Object with name=wrong does not exist.")

    def test_validation_for_multiple_still_happens(self):
        for action_name in (
            "multiple-optimized-list-classic",
            "multiple-classic-list-optimized",
            "multiple-optimized-list-optimized",
        ):
            with self.subTest(action=action_name):
                with self.subTest("nested"):
                    payload = [{"nested": "wrong", "many_nested": []}]

                    res = self.post(
                        action_name,
                        data=payload,
                    )
                    res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
                    self.assertEqual(res_data, [{"nested": ["Object with name=wrong does not exist."]}])

                with self.subTest("many nested"):
                    payload = [{"nested": None, "many_nested": ["wrong"]}]

                    res = self.post(
                        action_name,
                        data=payload,
                    )
                    res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)
                    self.assertEqual(res_data, [{"many_nested": ["Object with name=wrong does not exist."]}])

    def test_num_queries(self):
        expected_queries = {
            # 1 for FK validation
            # 2 for m2m validation,
            # 1 for create instance
            # 2 for create m2m (one select and one insert)
            "single-classic": 6,
            # 1 for FK validation
            # 1 for m2m validation
            # 1 for create instance
            # 2 for create m2m (one select and one insert)
            "single-optimized": 5,
            # 1 for FK validation first item
            # 2 for M2M validation multiple item
            # 1 for FK validation second item
            # 2 for M2M validation second item
            # 2 for create instance
            # 4 for create m2m (two select and two inserts)
            "multiple-classic-list-classic": 12,
            # 1 for FK validation first item
            # 1 for M2M validation multiple item
            # 1 for FK validation second item
            # 1 for M2M validation second item
            # 2 for create instance
            # 4 for create m2m (two select and two inserts)
            "multiple-optimized-list-classic": 10,
            # 1 for FK validation - all items
            # 1 for M2M validation - all items
            # 2 for create instance
            # 4 for create m2m (two select and two inserts)
            "multiple-classic-list-optimized": 8,
            # same as above actually as the custom list serializer replaces pk fields
            # 1 for FK validation - all items
            # 1 for M2M validation - all items
            # 2 for create instance
            # 4 for create m2m (two select and two inserts)
            "multiple-optimized-list-optimized": 8,
        }

        for action_name, expected in expected_queries.items():
            with self.subTest(action=action_name):
                with self.assertNumQueries(expected):
                    res = self.post(
                        action_name, self.single_payload if action_name.startswith("single-") else self.multiple_payload
                    )
                    self.assertEqual(res.status_code, status.HTTP_201_CREATED)
