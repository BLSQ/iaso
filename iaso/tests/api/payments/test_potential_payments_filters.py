import datetime

from django.contrib.auth.models import Group

from iaso.test import APITestCase
from iaso import models as m


class FilterPotentialPaymentsAPITestCase(APITestCase):

    @classmethod
    def setUpTestData(cls):
        data_source = m.DataSource.objects.create(name="Data source")
        version = m.SourceVersion.objects.create(number=1, data_source=data_source)
        org_unit_type = m.OrgUnitType.objects.create(name="Org unit type")
        parent_org_unit = m.OrgUnit.objects.create(name="Parent Org Unit")
        org_unit = m.OrgUnit.objects.create(
            org_unit_type=org_unit_type,
            version=version,
            uuid="1539f174-4c53-499c-85de-7a58458c49ef",
            parent=parent_org_unit,
        )

        account = m.Account.objects.create(name="Account", default_version=version)
        group = Group.objects.create(name="Group")
        user_role = m.UserRole.objects.create(account=account, group=group)
        project = m.Project.objects.create(name="Project", account=account, app_id="foo.bar.baz")
        user = cls.create_user_with_profile(username="user", account=account)
        user.iaso_profile.user_roles.add(user_role)
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
        cls.user_role = user_role
        cls.parent_org_unit = parent_org_unit

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
            "/api/potential_payments/?change_requests__created_at_after=2023-10-17&change_requests__created_at_before=2023-10-17"
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
        self.assertEqual(2, len(response.data["results"][0]["change_requests"]))

    def test_filter_on_users(self):
        change_request1 = m.OrgUnitChangeRequest.objects.create(
            org_unit=self.org_unit,
            new_name="Foo",
            created_by=self.user,
            status=m.OrgUnitChangeRequest.Statuses.APPROVED,
        )
        m.OrgUnitChangeRequest.objects.create(
            org_unit=self.org_unit,
            new_name="Foo",
            created_by=self.user_with_review_perm,
            status=m.OrgUnitChangeRequest.Statuses.APPROVED,
        )

        self.client.force_authenticate(self.user_with_review_perm)
        response = self.client.get(f"/api/potential_payments/?users={self.user.id}")
        self.assertJSONResponse(response, 200)
        self.assertEqual(1, len(response.data["results"]))
        self.assertEqual(1, len(response.data["results"][0]["change_requests"]))
        self.assertEqual(response.data["results"][0]["change_requests"][0]["id"], change_request1.id)

    def test_filter_on_user_roles(self):
        change_request1 = m.OrgUnitChangeRequest.objects.create(
            org_unit=self.org_unit,
            new_name="Foo",
            created_by=self.user,
            status=m.OrgUnitChangeRequest.Statuses.APPROVED,
        )
        m.OrgUnitChangeRequest.objects.create(
            org_unit=self.org_unit,
            new_name="Foo",
            created_by=self.user_with_review_perm,
            status=m.OrgUnitChangeRequest.Statuses.APPROVED,
        )

        self.client.force_authenticate(self.user_with_review_perm)
        response = self.client.get(f"/api/potential_payments/?user_roles={self.user_role.id}")
        self.assertJSONResponse(response, 200)
        self.assertEqual(1, len(response.data["results"]))
        self.assertEqual(1, len(response.data["results"][0]["change_requests"]))
        self.assertEqual(response.data["results"][0]["change_requests"][0]["id"], change_request1.id)

    def test_filter_on_parent_id(self):
        another_parent_org_unit = m.OrgUnit.objects.create(name="Another Parent Org Unit")
        another_org_unit = m.OrgUnit.objects.create(
            org_unit_type=self.org_unit_type,
            version=self.version,
            uuid="5879f174-4c53-499c-85de-7a58458c49ef",
            parent=another_parent_org_unit,
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

        response = self.client.get(f"/api/potential_payments/?parent_id={self.parent_org_unit.id}")
        self.assertJSONResponse(response, 200)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["change_requests"][0]["id"], change_request1.id)

        # Test filtering by old parent
        response = self.client.get(f"/api/potential_payments/?parent_id={another_parent_org_unit.id}")
        self.assertJSONResponse(response, 200)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["change_requests"][0]["id"], change_request2.id)

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
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(len(response.data["results"][0]["change_requests"]), 1)
        self.assertIn(change_request1.id, [change["id"] for change in response.data["results"][0]["change_requests"]])
        self.assertNotIn(
            change_request2.id, [change["id"] for change in response.data["results"][0]["change_requests"]]
        )

    def test_select_all_filter(self):
        m.OrgUnitChangeRequest.objects.create(
            org_unit=self.org_unit,
            new_name="Foo",
            created_by=self.user,
            status=m.OrgUnitChangeRequest.Statuses.APPROVED,
        )
        m.OrgUnitChangeRequest.objects.create(
            org_unit=self.org_unit,
            new_name="Bar",
            created_by=self.user,
            status=m.OrgUnitChangeRequest.Statuses.APPROVED,
        )
        self.client.force_authenticate(self.user_with_review_perm)
        response = self.client.get("/api/potential_payments/?select_all=true")
        self.assertJSONResponse(response, 200)
        self.assertTrue(
            len(response.data["results"][0]["change_requests"]) == 2, "select_all filter did not return all results"
        )

    def test_selected_ids_filter(self):
        another_user = self.create_user_with_profile(
            username="another_user",
            account=self.account,
            permissions=["iaso_org_unit_change_request_review"],
        )
        potential_payment1 = m.PotentialPayment.objects.create(
            user=self.user,
        )
        potential_payment2 = m.PotentialPayment.objects.create(
            user=another_user,
        )
        potential_payment3 = m.PotentialPayment.objects.create(
            user=self.user_with_review_perm,
        )

        m.OrgUnitChangeRequest.objects.create(
            org_unit=self.org_unit,
            new_name="Foo",
            created_by=self.user,
            status=m.OrgUnitChangeRequest.Statuses.APPROVED,
            potential_payment=potential_payment1,
        )
        m.OrgUnitChangeRequest.objects.create(
            org_unit=self.org_unit,
            new_name="Bar",
            created_by=another_user,
            status=m.OrgUnitChangeRequest.Statuses.APPROVED,
            potential_payment=potential_payment2,
        )
        m.OrgUnitChangeRequest.objects.create(
            org_unit=self.org_unit,
            new_name="new_name",
            created_by=self.user_with_review_perm,
            status=m.OrgUnitChangeRequest.Statuses.APPROVED,
            potential_payment=potential_payment3,
        )

        selected_ids = f"{potential_payment1.id},{potential_payment2.id}"
        self.client.force_authenticate(self.user_with_review_perm)
        response = self.client.get(f"/api/potential_payments/?selected_ids={selected_ids}")
        self.assertJSONResponse(response, 200)

        self.assertEqual(
            len(response.data["results"]),
            2,
            "selected_ids filter did not return the correct number of results",
        )
        potential_payments_in_results = [result["id"] for result in response.data["results"]]
        self.assertIn(
            potential_payment1.id,
            potential_payments_in_results,
            "potential_payment1 not found in selected_ids results",
        )
        self.assertIn(
            potential_payment2.id,
            potential_payments_in_results,
            "potential_payment2 not found in selected_ids results",
        )
        self.assertNotIn(
            potential_payment3.id,
            potential_payments_in_results,
            "potential_payment3 found in selected_ids results",
        )

    def test_unselected_ids_filter(self):
        another_user = self.create_user_with_profile(
            username="another_user",
            account=self.account,
            permissions=["iaso_org_unit_change_request_review"],
        )
        potential_payment1 = m.PotentialPayment.objects.create(
            user=self.user,
        )
        potential_payment2 = m.PotentialPayment.objects.create(
            user=another_user,
        )
        potential_payment3 = m.PotentialPayment.objects.create(
            user=self.user_with_review_perm,
        )

        m.OrgUnitChangeRequest.objects.create(
            org_unit=self.org_unit,
            new_name="Foo",
            created_by=self.user,
            status=m.OrgUnitChangeRequest.Statuses.APPROVED,
            potential_payment=potential_payment1,
        )
        m.OrgUnitChangeRequest.objects.create(
            org_unit=self.org_unit,
            new_name="Bar",
            created_by=another_user,
            status=m.OrgUnitChangeRequest.Statuses.APPROVED,
            potential_payment=potential_payment2,
        )
        m.OrgUnitChangeRequest.objects.create(
            org_unit=self.org_unit,
            new_name="new_name",
            created_by=self.user_with_review_perm,
            status=m.OrgUnitChangeRequest.Statuses.APPROVED,
            potential_payment=potential_payment3,
        )

        unselected_ids = f"{potential_payment1.id}"
        self.client.force_authenticate(self.user_with_review_perm)
        response = self.client.get(f"/api/potential_payments/?unselected_ids={unselected_ids}&select_all=true")
        self.assertJSONResponse(response, 200)
        self.assertEqual(
            len(response.data["results"]),
            2,
            "unselected_ids filter did not return the correct number of results",
        )
        potential_payments_in_results = [result["id"] for result in response.data["results"]]
        self.assertIn(
            potential_payment3.id,
            potential_payments_in_results,
            "potential_payment3 not found in selected_ids results",
        )
        self.assertIn(
            potential_payment2.id,
            potential_payments_in_results,
            "potential_payment2 not found in selected_ids results",
        )
        self.assertNotIn(
            potential_payment1.id,
            potential_payments_in_results,
            "potential_payment1 found in selected_ids results",
        )
