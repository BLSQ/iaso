from iaso.test import TestCase
from django.utils.timezone import now
from django.test import tag

from iaso import models as m


class InstanceModelTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):  # TODO: cleanup setup
        cls.now = now()

        star_wars = m.Account.objects.create(name="Star Wars")
        marvel = m.Account.objects.create(name="Marvel")

        cls.yoda = cls.create_user_with_profile(username="yoda", account=star_wars)
        cls.raccoon = cls.create_user_with_profile(username="raccoon", account=marvel)

        cls.jedi_council = m.OrgUnitType.objects.create(name="Jedi Council", short_name="Cnc")
        cls.jedi_academy = m.OrgUnitType.objects.create(name="Jedi Academy", short_name="Aca")
        cls.sith_guild = m.OrgUnitType.objects.create(name="Sith guild", short_name="Sith")

        cls.jedi_council_coruscant = m.OrgUnit.objects.create(name="Coruscant Jedi Council")

        cls.project_1 = m.Project.objects.create(name="Hydroponic gardens",
                                                 app_id="stars.empire.agriculture.hydroponics",
                                                 account=star_wars)

        cls.project_2 = m.Project.objects.create(name="New Land Speeder concept",
                                                 app_id="stars.empire.agriculture.land_speeder",
                                                 account=star_wars)

        cls.form_1 = m.Form.objects.create(name="Hydroponics study", period_type="MONTH", single_per_period=True)
        cls.form_1.org_unit_types.add(cls.jedi_council)
        cls.form_1.org_unit_types.add(cls.jedi_academy)
        cls.form_2 = m.Form.objects.create(name="Hydroponic public survey", form_id="sample2",
                                           device_field="deviceid", location_field="geoloc", period_type="QUARTER",
                                           single_per_period=False)
        cls.form_2.org_unit_types.add(cls.jedi_council)
        cls.form_2.org_unit_types.add(cls.jedi_academy)
        cls.form_2.save()

        cls.project_1.unit_types.add(cls.jedi_council)
        cls.project_1.unit_types.add(cls.jedi_academy)
        cls.project_1.forms.add(cls.form_1)
        cls.project_1.forms.add(cls.form_2)
        cls.project_1.save()

    @tag("iaso_only")
    def test_instance_status_annotation_duplicated(self):
        instance_1 = m.Instance.objects.create(form=self.form_1, period="202001", org_unit=self.jedi_council_coruscant)
        instance_2 = m.Instance.objects.create(form=self.form_1, period="202002", org_unit=self.jedi_council_coruscant)
        instance_3 = m.Instance.objects.create(form=self.form_1, period="202002", org_unit=self.jedi_council_coruscant)
        instance_4 = m.Instance.objects.create(form=self.form_1, period="202003", org_unit=self.jedi_council_coruscant,
                                               last_export_success_at=now())
        instance_5 = m.Instance.objects.create(form=self.form_2, period="2020Q1", org_unit=self.jedi_council_coruscant)
        instance_6 = m.Instance.objects.create(form=self.form_2, period="2020Q1", org_unit=self.jedi_council_coruscant)

        self.assertNumQueries(1, lambda: list(m.Instance.objects.with_status()))
        self.assertStatusIs(instance_1, m.Instance.STATUS_READY)
        self.assertStatusIs(instance_2, m.Instance.STATUS_DUPLICATED)
        self.assertStatusIs(instance_3, m.Instance.STATUS_DUPLICATED)
        self.assertStatusIs(instance_4, m.Instance.STATUS_EXPORTED)
        self.assertStatusIs(instance_5, m.Instance.STATUS_READY)
        self.assertStatusIs(instance_6, m.Instance.STATUS_READY)

    def assertStatusIs(self, instance: m.Instance, status: str):
        instance_with_status = m.Instance.objects.with_status().get(pk=instance.pk)
        self.assertEqual(instance_with_status.status, status)
