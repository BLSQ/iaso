import datetime

from django.urls import reverse
from rest_framework import status

from iaso.models import Account, DataSource, Group, OrgUnit, OrgUnitChangeRequest, OrgUnitType, Project, SourceVersion
from iaso.test import APITestCase, SwaggerTestCaseMixin


class Test(SwaggerTestCaseMixin, APITestCase):
    DT = datetime.datetime(2023, 10, 17, 17, 0, 0, 0, tzinfo=datetime.timezone.utc)

    def setUp(self):
        super().setUp()
        self.account = Account.objects.create(name="account")
        self.other_account = Account.objects.create(name="other_account")
        self.john_wick = self.create_user_with_profile(username="john_wick", account=self.account)
        self.john_doe = self.create_user_with_profile(username="john_doe", account=self.other_account)

        self.project_1 = Project.objects.create(name="Project", account=self.account, app_id="foo.bar.baz")
        self.project_2 = Project.objects.create(name="Project", account=self.other_account, app_id="foo.bar.baz2")

        self.data_source_1 = DataSource.objects.create(name="Data source")
        self.version_1 = SourceVersion.objects.create(number=1, data_source=self.data_source_1)
        self.org_unit_type_1 = OrgUnitType.objects.create(name="Org unit type")

        self.data_source_2 = DataSource.objects.create(name="Data source 2")
        self.version_2 = SourceVersion.objects.create(number=2, data_source=self.data_source_2)
        self.org_unit_type_2 = OrgUnitType.objects.create(name="Org unit type 2")

        self.ou_1 = OrgUnit.objects.create(
            org_unit_type=self.org_unit_type_1,
            version=self.version_1,
            source_ref="112244",
            uuid="1539f174-4c53-499c-85de-7a58458c49ef",
            closed_date=self.DT.date(),
            name="ou_1",
        )

        self.data_source_1.projects.set([self.project_1])
        self.org_unit_type_1.projects.set([self.project_1])
        self.john_wick.iaso_profile.org_units.set([self.ou_1])

        # Create a bunch of related objects. This is useful to detect N+1.
        group_1 = Group.objects.create(name="Group 1", source_version=self.version_1)
        group_2 = Group.objects.create(name="Group 2", source_version=self.version_1)
        group_3 = Group.objects.create(name="Group 3", source_version=self.version_1)
        self.ou_1.groups.add(group_1, group_2, group_3)

        self.oucr_1 = OrgUnitChangeRequest.objects.create(
            org_unit=self.ou_1, status=OrgUnitChangeRequest.Statuses.APPROVED, created_by=self.john_wick
        )

        self.oucr_2 = OrgUnitChangeRequest.objects.create(
            org_unit=self.ou_1, status=OrgUnitChangeRequest.Statuses.REJECTED, created_by=self.john_wick
        )

        self.ou_2 = OrgUnit.objects.create(
            org_unit_type=self.org_unit_type_2,
            version=self.version_2,
            source_ref="112245",
            uuid="1539f174-4c53-499c-85de-7a58458c49eg",
            closed_date=self.DT.date(),
            name="ou_2",
        )

        group_4 = Group.objects.create(name="Group 4", source_version=self.version_2)
        group_5 = Group.objects.create(name="Group 5", source_version=self.version_2)
        group_6 = Group.objects.create(name="Group 6", source_version=self.version_2)
        self.ou_2.groups.add(group_4, group_5, group_6)

        self.data_source_2.projects.set([self.project_2])
        self.org_unit_type_2.projects.set([self.project_2])
        self.john_doe.iaso_profile.org_units.set([self.ou_2])

        self.oucr_3 = OrgUnitChangeRequest.objects.create(
            org_unit=self.ou_2, status=OrgUnitChangeRequest.Statuses.REJECTED, created_by=self.john_doe
        )

    def assertValidData(self, data, expected_length):
        self.assertValidListData(list_data=data, results_key="results", expected_length=expected_length, paginated=True)
        self.assertResponseCompliantToSwagger(data, "PaginatedETLOrgUnitChangeRequestListList")

    def assertValidRetrieveData(self, data):
        self.assertResponseCompliantToSwagger(data, "ETLOrgUnitChangeRequestList")

    def test_num_queries_list(self):
        self.client.force_authenticate(self.john_wick)
        with self.assertNumQueries(8):
            # 1: OU queryset filter
            # 2: filter_for_user
            # 3: pagination
            # 4-8: data retrieve with prefetch related
            res = self.client.get(reverse("api-etl:org-unit-change-requests-list"))
            self.assertJSONResponse(res, status.HTTP_200_OK)

    def test_num_queries_retrieve(self):
        self.client.force_authenticate(self.john_wick)
        with self.assertNumQueries(7):
            # 1: OU queryset filter
            # 2: filter_for_user
            # 3: pagination
            # 4-7: data retrieve with prefetch related
            res = self.client.get(reverse("api-etl:org-unit-change-requests-detail", kwargs={"pk": self.oucr_1.pk}))
            self.assertJSONResponse(res, status.HTTP_200_OK)

    def test_permissions_retrieve(self):
        res = self.client.get(reverse("api-etl:org-unit-change-requests-detail", kwargs={"pk": self.oucr_1.pk}))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.john_wick)
        res = self.client.get(reverse("api-etl:org-unit-change-requests-detail", kwargs={"pk": self.oucr_1.pk}))
        self.assertJSONResponse(res, status.HTTP_200_OK)

    def test_permissions_list(self):
        res = self.client.get(reverse("api-etl:org-unit-change-requests-list"))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.john_wick)
        res = self.client.get(reverse("api-etl:org-unit-change-requests-list"))
        self.assertJSONResponse(res, status.HTTP_200_OK)

    def test_retrieve_should_not_see_ou_linked_to_other_account(self):
        self.client.force_authenticate(self.john_wick)
        res = self.client.get(reverse("api-etl:org-unit-change-requests-detail", kwargs={"pk": self.oucr_1.pk}))
        self.assertJSONResponse(res, status.HTTP_200_OK)

        res = self.client.get(reverse("api-etl:org-unit-change-requests-detail", kwargs={"pk": self.oucr_2.pk}))
        self.assertJSONResponse(res, status.HTTP_200_OK)

        res = self.client.get(reverse("api-etl:org-unit-change-requests-detail", kwargs={"pk": self.oucr_3.pk}))
        self.assertJSONResponse(res, status.HTTP_404_NOT_FOUND)

        self.client.force_authenticate(self.john_doe)
        res = self.client.get(reverse("api-etl:org-unit-change-requests-detail", kwargs={"pk": self.oucr_1.pk}))
        self.assertJSONResponse(res, status.HTTP_404_NOT_FOUND)

        res = self.client.get(reverse("api-etl:org-unit-change-requests-detail", kwargs={"pk": self.oucr_2.pk}))
        self.assertJSONResponse(res, status.HTTP_404_NOT_FOUND)

        res = self.client.get(reverse("api-etl:org-unit-change-requests-detail", kwargs={"pk": self.oucr_3.pk}))
        self.assertJSONResponse(res, status.HTTP_200_OK)

    def test_list_should_not_see_ou_linked_to_other_account(self):
        self.client.force_authenticate(self.john_wick)
        res = self.client.get(reverse("api-etl:org-unit-change-requests-list"))
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data, 2)

        self.assertNotIn(self.oucr_3.pk, [x["id"] for x in res_data["results"]])

        self.client.force_authenticate(self.john_doe)
        res = self.client.get(reverse("api-etl:org-unit-change-requests-list"))
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data, 1)

        self.assertNotIn(self.oucr_1.pk, [x["id"] for x in res_data["results"]])
        self.assertNotIn(self.oucr_2.pk, [x["id"] for x in res_data["results"]])

    def test_has_dynamic_fields(self):
        self.client.force_authenticate(self.john_wick)

        with self.subTest("list"):
            res = self.client.get(
                reverse("api-etl:org-unit-change-requests-list"), data={"fields": ["id", "created_by"]}
            )

            res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
            self.assertEqual(len(res_data["results"]), 2)
            for data in res_data["results"]:
                self.assertCountEqual(["id", "created_by"], data.keys())

        with self.subTest("retrieve"):
            res = self.client.get(
                reverse("api-etl:org-unit-change-requests-detail", kwargs={"pk": self.oucr_1.pk}),
                data={"fields": ["id", "created_by"]},
            )
            res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
            self.assertCountEqual(["id", "created_by"], res_data.keys())

    def test_retrieve(self):
        self.client.force_authenticate(self.john_wick)
        res = self.client.get(reverse("api-etl:org-unit-change-requests-detail", kwargs={"pk": self.oucr_1.pk}))
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidRetrieveData(res_data)

    def test_list(self):
        self.client.force_authenticate(self.john_wick)
        res = self.client.get(reverse("api-etl:org-unit-change-requests-list"))
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data, 2)

        self.assertCountEqual([x["id"] for x in res_data["results"]], [self.oucr_1.pk, self.oucr_2.pk])
