from io import StringIO

from django.core import management

from iaso import models as m
from iaso.test import APITestCase


class InstancesAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        star_wars = m.Account.objects.create(name="Star Wars")
        star_wars.save()

        cls.jedi_council = m.OrgUnitType.objects.create(name="Jedi Council", short_name="Cnc")

        cls.jedi_council_endor = m.OrgUnit.objects.create(name="Endor Jedi Council")

        cls.project_1 = m.Project.objects.create(
            name="Hydroponic gardens", app_id="stars.empire.agriculture.hydroponics", account=star_wars
        )

        cls.form_1 = m.Form.objects.create(name="Hydroponics study", period_type=m.MONTH, single_per_period=True)

        cls.form_2 = m.Form.objects.create(name="Hydroponics interview", period_type=m.QUARTER, single_per_period=True)

        cls.instance_1 = cls.create_form_instance(
            form=cls.form_1, period="202001", org_unit=cls.jedi_council_endor, project=cls.project_1
        )
        cls.instance_2 = cls.create_form_instance(
            form=cls.form_1, period="202002", org_unit=cls.jedi_council_endor, project=cls.project_1
        )
        cls.instance_3 = cls.create_form_instance(
            form=cls.form_2, period="2020Q2", org_unit=cls.jedi_council_endor, project=cls.project_1
        )

        cls.project_1.unit_types.add(cls.jedi_council)
        cls.project_1.forms.set([cls.form_1, cls.form_2])

        cls.project_2 = m.Project.objects.create(
            name="Lightsaber mark3", app_id="stars.empire.lightsaber", account=star_wars
        )
        cls.project_2.unit_types.add(cls.jedi_council)
        cls.form_3 = m.Form.objects.create(name="Land speeder study", period_type=m.QUARTER, single_per_period=False)
        cls.instance_4 = cls.create_form_instance(
            form=cls.form_3, period="2020Q3", org_unit=cls.jedi_council_endor, project=cls.project_2
        )
        cls.instance_5 = cls.create_form_instance(
            form=cls.form_3, period="2020Q4", org_unit=cls.jedi_council_endor, project=cls.project_2
        )
        cls.project_2.forms.add(cls.form_3)

    def test_mark_instance_as_deleted_ok(self):
        """mark_instance_as_deleted command happy path"""

        self.assertEqual(0, m.Instance.objects.filter(deleted=True).count())

        management.call_command("mark_instances_as_deleted", self.project_1.id, stdout=StringIO(), force=True)

        self.assertEqual(3, m.Instance.objects.filter(deleted=True).count())

        for instance in [self.instance_1, self.instance_2, self.instance_3]:
            instance.refresh_from_db()
            self.assertTrue(instance.deleted)

        for instance in [self.instance_4, self.instance_5]:
            instance.refresh_from_db()
            self.assertFalse(instance.deleted)

    def test_mark_instance_as_deleted_no_force(self):
        """mark_instance_as_deleted command happy path"""

        self.assertEqual(0, m.Instance.objects.filter(deleted=True).count())

        management.call_command("mark_instances_as_deleted", self.project_1.id, stdout=StringIO())

        self.assertEqual(0, m.Instance.objects.filter(deleted=True).count())
