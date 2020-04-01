from iaso.test import TestCase
from django.utils.timezone import now
from django.test import tag
from django.core.files.uploadedfile import UploadedFile
from iaso import models as m


class InstanceModelTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.maxDiff = None
        star_wars = m.Account.objects.create(name="Star Wars")

        cls.jedi_council = m.OrgUnitType.objects.create(
            name="Jedi Council", short_name="Cnc"
        )
        cls.jedi_academy = m.OrgUnitType.objects.create(
            name="Jedi Academy", short_name="Aca"
        )

        cls.jedi_council_coruscant = m.OrgUnit.objects.create(
            name="Coruscant Jedi Council", org_unit_type=cls.jedi_council
        )
        cls.jedi_academy_dagobah = m.OrgUnit.objects.create(
            name="Coruscant Jedi Council", org_unit_type=cls.jedi_academy
        )

        cls.project = m.Project.objects.create(
            name="Hydroponic gardens",
            app_id="stars.empire.agriculture.hydroponics",
            account=star_wars,
        )

        cls.form_1 = m.Form.objects.create(
            name="Hydroponics study", period_type="MONTH", single_per_period=True
        )
        cls.form_1.org_unit_types.add(cls.jedi_council)
        cls.form_1.org_unit_types.add(cls.jedi_academy)
        cls.form_2 = m.Form.objects.create(
            name="Hydroponic public survey",
            form_id="sample2",
            device_field="deviceid",
            location_field="geoloc",
            period_type="QUARTER",
            single_per_period=False,
        )
        cls.form_2.org_unit_types.add(cls.jedi_council)
        cls.form_2.org_unit_types.add(cls.jedi_academy)
        cls.form_2.save()

        cls.project.unit_types.add(cls.jedi_council)
        cls.project.unit_types.add(cls.jedi_academy)
        cls.project.forms.add(cls.form_1)
        cls.project.forms.add(cls.form_2)
        cls.project.save()

    @tag("iaso_only")
    def test_instance_status(self):
        instance_1 = self.create_form_instance(
            form=self.form_1, period="202001", org_unit=self.jedi_council_coruscant
        )
        instance_2 = self.create_form_instance(
            form=self.form_1, period="202002", org_unit=self.jedi_council_coruscant
        )
        instance_3 = self.create_form_instance(
            form=self.form_1, period="202002", org_unit=self.jedi_council_coruscant
        )
        instance_4 = self.create_form_instance(
            form=self.form_1,
            period="202003",
            org_unit=self.jedi_council_coruscant,
            last_export_success_at=now(),
        )
        instance_5 = self.create_form_instance(
            form=self.form_2, period="2020Q1", org_unit=self.jedi_council_coruscant
        )
        instance_6 = self.create_form_instance(
            form=self.form_2, period="2020Q1", org_unit=self.jedi_academy_dagobah
        )

        self.assertNumQueries(1, lambda: list(m.Instance.objects.with_status()))
        self.assertStatusIs(instance_1, m.Instance.STATUS_READY)
        self.assertStatusIs(instance_2, m.Instance.STATUS_DUPLICATED)
        self.assertStatusIs(instance_3, m.Instance.STATUS_DUPLICATED)
        self.assertStatusIs(instance_4, m.Instance.STATUS_EXPORTED)
        self.assertStatusIs(instance_5, m.Instance.STATUS_READY)
        self.assertStatusIs(instance_6, m.Instance.STATUS_READY)

    def test_instance_status_duplicated_over_exported(self):
        instance_1 = self.create_form_instance(
            form=self.form_1,
            period="202002",
            org_unit=self.jedi_council_coruscant,
            last_export_success_at=now(),
        )
        instance_2 = self.create_form_instance(
            form=self.form_1,
            period="202002",
            org_unit=self.jedi_council_coruscant,
            last_export_success_at=now(),
        )

        self.assertStatusIs(instance_1, m.Instance.STATUS_DUPLICATED)
        self.assertStatusIs(instance_2, m.Instance.STATUS_DUPLICATED)

    def test_instance_status_counts(self):
        self.create_form_instance(
            form=self.form_1, period="201901", org_unit=self.jedi_council_coruscant
        )
        self.create_form_instance(
            form=self.form_1, period="201901", org_unit=self.jedi_council_coruscant
        )
        self.create_form_instance(
            form=self.form_1, period="201902", org_unit=self.jedi_council_coruscant
        )
        self.create_form_instance(
            form=self.form_1, period="201903", org_unit=self.jedi_council_coruscant
        )

        self.create_form_instance(
            form=self.form_1, period="201901", org_unit=self.jedi_academy_dagobah
        )
        self.create_form_instance(
            form=self.form_1, period="201902", org_unit=self.jedi_academy_dagobah
        )
        self.create_form_instance(
            form=self.form_1,
            period="201903",
            org_unit=self.jedi_academy_dagobah,
            last_export_success_at=now(),
        )

        counts = sorted(
            m.Instance.objects.with_status().counts_by_status(),
            key=lambda x: x["period"],
        )
        self.assertEquals(
            counts,
            [
                {
                    "period": "201901",
                    "form_id": self.form_1.id,
                    "form__name": "Hydroponics study",
                    "total_count": 3,
                    "ready_count": 1,
                    "duplicated_count": 2,
                    "exported_count": 0,
                },
                {
                    "period": "201902",
                    "form_id": self.form_1.id,
                    "form__name": "Hydroponics study",
                    "total_count": 2,
                    "ready_count": 2,
                    "duplicated_count": 0,
                    "exported_count": 0,
                },
                {
                    "period": "201903",
                    "form_id": self.form_1.id,
                    "form__name": "Hydroponics study",
                    "total_count": 2,
                    "ready_count": 1,
                    "duplicated_count": 0,
                    "exported_count": 1,
                },
            ],
        )

        self.assertEquals(
            sorted(
                m.Instance.objects.filter(period__in=["201903"])
                .with_status()
                .counts_by_status(),
                key=lambda x: x["period"],
            ),
            [
                {
                    "period": "201903",
                    "form_id": self.form_1.id,
                    "form__name": "Hydroponics study",
                    "total_count": 2,
                    "ready_count": 1,
                    "duplicated_count": 0,
                    "exported_count": 1,
                }
            ],
        )

    def assertStatusIs(self, instance: m.Instance, status: str):
        instance_with_status = m.Instance.objects.with_status().get(pk=instance.pk)
        self.assertEqual(instance_with_status.status, status)

    def test_xml_to_json_should_contains_version(self):

        instance = m.Instance.objects.create(
            form=self.form_1,
            period="202001",
            org_unit=self.jedi_council_coruscant,
            file=UploadedFile(open("iaso/tests/fixtures/hydroponics_test_upload.xml")),
        )

        json_instance = instance.get_and_save_json_of_xml()
        self.assertEqual(json_instance["_version"], "201911280919")

        # assert flattened and  lowered case keys
        self.assertEqual(
            json_instance,
            {
                "uuid": "385689b3b55f4739b80dcba5540c5f87",
                "start": "2019-12-02T14:07:52.465+01:00",
                "end": "2019-12-02T14:10:11.380+01:00",
                "today": "2019-12-02",
                "deviceid": "358544083104930",
                "subscriberid": "206300001285696",
                "imei": "358544083104930",
                "simserial": "8932030000106638166",
                "phonenumber": "",
                "user_name": "Tttt",
                "region": "UnCrC8p12UN",
                "prefecture": "IJoQdfGfYsC",
                "district": "tSs16aZvMD4",
                "sous-prefecture": "drMs7e3pDFZ",
                "fosa": "FeNjVewpswJ",
                "year": "2019",
                "quarter": "1",
                "ident_type_structure": "ce",
                "ident_type_services": "serv_prot",
                "ident_type_serv_medical": "0",
                "ident_type_serv_protect": "1",
                "ident_type_serv_jurid": "0",
                "ident_type_serv_psycho": "0",
                "ident_type_serv_educ": "0",
                "ident_type_serv_recope": "0",
                "ident_type_serv_club": "0",
                "ident_statut": "ong",
                "ident_eau_courante": "1",
                "ident_electricite": "0",
                "ident_nom_responsable": "Chggh",
                "ident_telephone": "256",
                "fermeture_structure": "sam",
                "ident_ferm_lundi": "0",
                "ident_ferm_mardi": "0",
                "ident_ferm_mercredi": "0",
                "ident_ferm_jeudi": "0",
                "ident_ferm_vendredi": "0",
                "ident_ferm_samedi": "1",
                "ident_ferm_dim": "0",
                "ident_ferm_aucun": "0",
                "ident_serv_cout": "0",
                "ident_type_batiment": "sem_dur",
                "imgurl": "1575292156137.jpg",
                "gps": "50.8367386 4.40093901 123.56201171875 49.312",
                "meta": "",
                "instanceid": "uuid:7ff9b3b4-9404-4702-bbe4-efe2407aef02",
                "_version": "201911280919",
            },
        )

    def test_xml_to_json_should_support_xml_without_version(self):

        instance = m.Instance.objects.create(
            form=self.form_1,
            period="202001",
            org_unit=self.jedi_council_coruscant,
            file=UploadedFile(
                open("iaso/tests/fixtures/hydroponics_test_upload_without_version.xml")
            ),
        )

        json_instance = instance.get_and_save_json_of_xml()
        self.assertTrue("_version" not in json_instance)
