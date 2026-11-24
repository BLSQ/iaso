"""
Purpose of this test file is to also show the benefits of using our related fields and list serializers compared to classic DRF ones
Ofc this test would fail if DRF fixes is stuff internally, hence you'll know that it's time to get rid of those fields and use the classic ones

"""

from typing import Any

from django.test import override_settings
from django.urls import reverse
from rest_framework import routers, status

from iaso.test import APITestCase
from iaso.tests.base_app.api.common.serializers.list.models import OtherTestNestedModel, TestNestedModel
from iaso.tests.base_app.api.common.serializers.list.views import TestPKRelatedViewSet, TestSlugRelatedViewSet


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
