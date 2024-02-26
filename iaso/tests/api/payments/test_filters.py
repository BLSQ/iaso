import datetime
import json

from django.contrib.auth.models import Group

from iaso.test import APITestCase
from django.contrib.gis.geos import Point
from iaso import models as m


class FilterPotentialPaymentsAPITestCase(APITestCase):
    """
    Test filtering on the ViewSet.
    """

    @classmethod
    def setUpTestData(cls):
        data_source = m.DataSource.objects.create(name="Data source")
        version = m.SourceVersion.objects.create(number=1, data_source=data_source)
        org_unit_type = m.OrgUnitType.objects.create(name="Org unit type")
        org_unit = m.OrgUnit.objects.create(
            org_unit_type=org_unit_type, version=version, uuid="1539f174-4c53-499c-85de-7a58458c49ef"
        )

        account = m.Account.objects.create(name="Account", default_version=version)
        project = m.Project.objects.create(name="Project", account=account, app_id="foo.bar.baz")
        user = cls.create_user_with_profile(username="user", account=account)
        user_with_review_perm = cls.create_user_with_profile(
            username="user_with_review_perm",
            account=account,
            permissions=["iaso_org_unit_change_request_review", "iaso_payments"],
        )

        form = m.Form.objects.create(name="Form")
        instance = m.Instance.objects.create(
            org_unit=org_unit,
            form=form,
            project=project,
        )

        m.OrgUnitReferenceInstance.objects.create(org_unit=org_unit, instance=instance, form=form)
        org_unit.reference_instances.add(instance)

        data_source.projects.set([project])
        org_unit_type.projects.set([project])
        user.iaso_profile.org_units.set([org_unit])

        cls.form = form
        cls.account = account
        cls.org_unit = org_unit
        cls.org_unit_type = org_unit_type
        cls.project = project
        cls.user = user
        cls.user_with_review_perm = user_with_review_perm
        cls.version = version

    def test_filter_potential_payments_on_change_request_date_created_from_and_date_created_to(self):
        self.client.force_authenticate(self.user_with_review_perm)

        # Create change_requests and associate them with PotentialPayment
        change_request1 = m.OrgUnitChangeRequest.objects.create(
            org_unit=self.org_unit,
            new_name="Foo",
            created_by=self.user,
            status=m.OrgUnitChangeRequest.Statuses.APPROVED,
        )
        change_request1.created_at = datetime.datetime(2023, 10, 17, 17, 0, 0, 0, tzinfo=datetime.timezone.utc)
        change_request1.save()

        change_request2 = m.OrgUnitChangeRequest.objects.create(
            org_unit=self.org_unit,
            new_name="Bar",
            status=m.OrgUnitChangeRequest.Statuses.APPROVED,
            created_by=self.user,
        )
        change_request2.created_at = datetime.datetime(2022, 10, 17, 17, 0, 0, 0, tzinfo=datetime.timezone.utc)
        change_request2.save()

        response = self.client.get(
            "/api/potential_payments/?change_requests__created_at_after=17-10-2023&change_requests__created_at_before=17-10-2023"
        )
        self.assertJSONResponse(response, 200)
        self.assertEqual(1, len(response.data["results"][0]["change_requests"]))

        response = self.client.get("/api/potential_payments/?change_requests__created_at_after=17-10-2022")
        self.assertJSONResponse(response, 200)
        self.assertEqual(1, len(response.data["results"]))
        self.assertEqual(2, len(response.data["results"][0]["change_requests"]))

        response = self.client.get("/api/potential_payments/?change_requests__created_at_before=17-10-2022")
        self.assertJSONResponse(response, 200)
        self.assertEqual(1, len(response.data["results"]))
        self.assertEqual(1, len(response.data["results"][0]["change_requests"]))

    # def test_filter_on_parent_id(self):
    #     parent_org_unit = m.OrgUnit.objects.create(name="Parent Org Unit")
    #     another_parent_org_unit = m.OrgUnit.objects.create(name="Another Parent Org Unit")

    #     # Create a change request with a new parent
    #     change_request1 = m.OrgUnitChangeRequest.objects.create(
    #         org_unit=self.org_unit, new_name="Foo", new_parent=parent_org_unit
    #     )

    #     # Create a change request with an old parent
    #     change_request2 = m.OrgUnitChangeRequest.objects.create(
    #         org_unit=self.org_unit, new_name="Bar", old_parent=another_parent_org_unit
    #     )

    #     change_request2.old_parent = another_parent_org_unit
    #     change_request2.save()
    #     self.client.force_authenticate(self.user)

    #     # Test filtering by new parent
    #     response = self.client.get(f"/api/potential_payments/?parent_id={parent_org_unit.id}")
    #     self.assertJSONResponse(response, 200)
    #     self.assertEqual(len(response.data["results"]), 1)
    #     self.assertIn(change_request1.id, [change["id"] for change in response.data["results"]])
    #     self.assertNotIn(change_request2.id, [change["id"] for change in response.data["results"]])

    #     # Test filtering by old parent
    #     response = self.client.get(f"/api/potential_payments/?parent_id={another_parent_org_unit.id}")
    #     self.assertJSONResponse(response, 200)
    #     self.assertEqual(len(response.data["results"]), 1)
    #     self.assertNotIn(change_request1.id, [change["id"] for change in response.data["results"]])
    #     self.assertIn(change_request2.id, [change["id"] for change in response.data["results"]])

    def test_filter_on_forms(self):
        another_form = m.Form.objects.create(name="Another form")
        another_instance = m.Instance.objects.create(
            org_unit=self.org_unit,
            form=another_form,
            project=self.project,
        )
        another_org_unit = m.OrgUnit.objects.create(
            org_unit_type=self.org_unit_type, version=self.version, uuid="12345678"
        )
        m.OrgUnitReferenceInstance.objects.create(
            org_unit=another_org_unit, instance=another_instance, form=another_form
        )

        change_request1 = m.OrgUnitChangeRequest.objects.create(
            org_unit=self.org_unit,
            new_name="Foo",
            created_by=self.user,
            status=m.OrgUnitChangeRequest.Statuses.APPROVED,
        )
        change_request2 = m.OrgUnitChangeRequest.objects.create(
            org_unit=another_org_unit,
            new_name="Bar",
            created_by=self.user,
            status=m.OrgUnitChangeRequest.Statuses.APPROVED,
        )

        self.client.force_authenticate(self.user_with_review_perm)
        response = self.client.get(f"/api/potential_payments/?forms={self.form.id}")
        self.assertJSONResponse(response, 200)
        print(json.dumps(response.data["results"], indent=4))
        self.assertEqual(len(response.data["results"]["change_requests"]), 1)
        self.assertEqual(response.data["results"][0]["id"], change_request1.id)
        self.assertNotIn(change_request2.id, [change["id"] for change in response.data["results"]])
