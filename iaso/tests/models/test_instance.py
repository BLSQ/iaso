from django.core.files import File
from django.core.files.uploadedfile import UploadedFile
from django.utils.timezone import now
from django.core.exceptions import ValidationError

from hat.audit.models import Modification, INSTANCE_API
from iaso import models as m
from iaso.odk import parsing
from iaso.test import TestCase


class InstanceModelTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.maxDiff = None
        star_wars = m.Account.objects.create(name="Star Wars")

        cls.yoda = cls.create_user_with_profile(username="yoda", account=star_wars)

        cls.sector = m.OrgUnitType.objects.create(name="Sector", short_name="Sec")
        cls.system = m.OrgUnitType.objects.create(name="System", short_name="Sys")
        cls.jedi_council = m.OrgUnitType.objects.create(name="Jedi Council", short_name="Cnc")
        cls.jedi_academy = m.OrgUnitType.objects.create(name="Jedi Academy", short_name="Aca")

        cls.jedi_council_coruscant = m.OrgUnit.objects.create(
            name="Coruscant Jedi Council", org_unit_type=cls.jedi_council
        )
        cls.jedi_academy_coruscant = m.OrgUnit.objects.create(
            name="Coruscant Jedi Academy", org_unit_type=cls.jedi_academy
        )

        cls.project = m.Project.objects.create(
            name="Hydroponic gardens", app_id="stars.empire.agriculture.hydroponics", account=star_wars
        )

        cls.form_1 = m.Form.objects.create(name="Hydroponics study", period_type="MONTH", single_per_period=True)
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

    def test_instance_status(self):
        instance_1 = self.create_form_instance(form=self.form_1, period="202001", org_unit=self.jedi_council_coruscant)
        instance_2 = self.create_form_instance(form=self.form_1, period="202002", org_unit=self.jedi_council_coruscant)
        instance_3 = self.create_form_instance(form=self.form_1, period="202002", org_unit=self.jedi_council_coruscant)
        instance_4 = self.create_form_instance(
            form=self.form_1, period="202003", org_unit=self.jedi_council_coruscant, last_export_success_at=now()
        )
        instance_5 = self.create_form_instance(form=self.form_2, period="2020Q1", org_unit=self.jedi_council_coruscant)
        instance_6 = self.create_form_instance(form=self.form_2, period="2020Q1", org_unit=self.jedi_academy_coruscant)

        self.assertNumQueries(1, lambda: list(m.Instance.objects.with_status()))
        self.assertStatusIs(instance_1, m.Instance.STATUS_READY)
        self.assertStatusIs(instance_2, m.Instance.STATUS_DUPLICATED)
        self.assertStatusIs(instance_3, m.Instance.STATUS_DUPLICATED)
        self.assertStatusIs(instance_4, m.Instance.STATUS_EXPORTED)
        self.assertStatusIs(instance_5, m.Instance.STATUS_READY)
        self.assertStatusIs(instance_6, m.Instance.STATUS_READY)

    def test_instance_status_duplicated_over_exported(self):
        instance_1 = self.create_form_instance(
            form=self.form_1, period="202002", org_unit=self.jedi_council_coruscant, last_export_success_at=now()
        )
        instance_2 = self.create_form_instance(
            form=self.form_1, period="202002", org_unit=self.jedi_council_coruscant, last_export_success_at=now()
        )

        self.assertStatusIs(instance_1, m.Instance.STATUS_DUPLICATED)
        self.assertStatusIs(instance_2, m.Instance.STATUS_DUPLICATED)

    def test_instance_status_counts(self):
        self.create_form_instance(form=self.form_1, period="201901", org_unit=self.jedi_council_coruscant)
        self.create_form_instance(form=self.form_1, period="201901", org_unit=self.jedi_council_coruscant)
        self.create_form_instance(form=self.form_1, period="201902", org_unit=self.jedi_council_coruscant)
        self.create_form_instance(form=self.form_1, period="201903", org_unit=self.jedi_council_coruscant)

        self.create_form_instance(form=self.form_1, period="201901", org_unit=self.jedi_academy_coruscant)
        self.create_form_instance(form=self.form_1, period="201902", org_unit=self.jedi_academy_coruscant)
        self.create_form_instance(
            form=self.form_1, period="201903", org_unit=self.jedi_academy_coruscant, last_export_success_at=now()
        )

        counts = sorted(m.Instance.objects.with_status().counts_by_status(), key=lambda x: x["period"])
        self.assertEquals(
            counts,
            [
                {
                    "period": "201901",
                    "form_id": self.form_1.id,
                    "form__name": "Hydroponics study",
                    "form__form_id": None,
                    "total_count": 3,
                    "ready_count": 1,
                    "duplicated_count": 2,
                    "exported_count": 0,
                },
                {
                    "period": "201902",
                    "form_id": self.form_1.id,
                    "form__name": "Hydroponics study",
                    "form__form_id": None,
                    "total_count": 2,
                    "ready_count": 2,
                    "duplicated_count": 0,
                    "exported_count": 0,
                },
                {
                    "period": "201903",
                    "form_id": self.form_1.id,
                    "form__name": "Hydroponics study",
                    "form__form_id": None,
                    "total_count": 2,
                    "ready_count": 1,
                    "duplicated_count": 0,
                    "exported_count": 1,
                },
            ],
        )

        self.assertEquals(
            sorted(
                m.Instance.objects.filter(period__in=["201903"]).with_status().counts_by_status(),
                key=lambda x: x["period"],
            ),
            [
                {
                    "period": "201903",
                    "form_id": self.form_1.id,
                    "form__name": "Hydroponics study",
                    "form__form_id": None,
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

    def test_xml_to_json_should_contains_chars_encoding(self):
        instance = m.Instance.objects.create(
            form=self.form_1,
            period="202001",
            org_unit=self.jedi_council_coruscant,
            file=UploadedFile(open("iaso/tests/fixtures/hydroponics_test_upload_with_encoding.xml")),
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
                "Ident_type_structure": "ce",
                "Ident_type_services": "serv_prot",
                "Ident_type_serv_medical": "0",
                "Ident_type_serv_protect": "1",
                "Ident_type_serv_jurid": "0",
                "Ident_type_serv_psycho": "0",
                "Ident_type_serv_educ": "0",
                "Ident_type_serv_recope": "0",
                "Ident_type_serv_club": "0",
                "Ident_statut": "ong",
                "Ident_eau_courante": "1",
                "Ident_electricite": "0",
                "Ident_nom_responsable": "MAÏGA Encoding",
                "Ident_telephone": "256",
                "fermeture_structure": "sam",
                "Ident_ferm_lundi": "0",
                "Ident_ferm_mardi": "0",
                "Ident_ferm_mercredi": "0",
                "Ident_ferm_jeudi": "0",
                "Ident_ferm_vendredi": "0",
                "Ident_ferm_samedi": "1",
                "Ident_ferm_dim": "0",
                "Ident_ferm_aucun": "0",
                "Ident_serv_cout": "0",
                "Ident_type_batiment": "sem_dur",
                "imgUrl": "1575292156137.jpg",
                "gps": "50.8367386 4.40093901 123.56201171875 49.312",
                "instanceID": "uuid:7ff9b3b4-9404-4702-bbe4-efe2407aef02",
                "_version": "201911280919",
            },
        )

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
                "Ident_type_structure": "ce",
                "Ident_type_services": "serv_prot",
                "Ident_type_serv_medical": "0",
                "Ident_type_serv_protect": "1",
                "Ident_type_serv_jurid": "0",
                "Ident_type_serv_psycho": "0",
                "Ident_type_serv_educ": "0",
                "Ident_type_serv_recope": "0",
                "Ident_type_serv_club": "0",
                "Ident_statut": "ong",
                "Ident_eau_courante": "1",
                "Ident_electricite": "0",
                "Ident_nom_responsable": "Chggh",
                "Ident_telephone": "256",
                "fermeture_structure": "sam",
                "Ident_ferm_lundi": "0",
                "Ident_ferm_mardi": "0",
                "Ident_ferm_mercredi": "0",
                "Ident_ferm_jeudi": "0",
                "Ident_ferm_vendredi": "0",
                "Ident_ferm_samedi": "1",
                "Ident_ferm_dim": "0",
                "Ident_ferm_aucun": "0",
                "Ident_serv_cout": "0",
                "Ident_type_batiment": "sem_dur",
                "imgUrl": "1575292156137.jpg",
                "gps": "50.8367386 4.40093901 123.56201171875 49.312",
                "instanceID": "uuid:7ff9b3b4-9404-4702-bbe4-efe2407aef02",
                "_version": "201911280919",
            },
        )

    def test_xml_to_json_with_repeat_group(self):
        """Test that the repeat group is correctly handled

        Note: this also indirectly tests that some paths are always allowed in the XML (see ALWAYS_ALLOWED_PATHS_XML):
        if not, the JSON representation will lack the uuid field.
        """
        instance = m.Instance.objects.create(
            form=self.form_1,
            period="202001",
            org_unit=self.jedi_council_coruscant,
            file=UploadedFile(open("iaso/tests/fixtures/odk_instance_repeat_group.xml")),
        )

        with open("iaso/tests/fixtures/odk_instance_repeat_group_form.xlsx", "rb") as form_1_version_1_file:
            survey = parsing.parse_xls_form(form_1_version_1_file)
            form_version = m.FormVersion.objects.create_for_form_and_survey(
                form=self.form_1, survey=survey, xls_file=File(form_1_version_1_file)
            )
            form_version.version_id = "202008121012"  # force version to match instance files
            form_version.save()

        json_instance = instance.get_and_save_json_of_xml()
        # assert flattened and  lowered case keys
        self.assertEqual(
            json_instance,
            {
                "uuid": "33fd651edeca4f799ba60bfdec66d4bf",
                "is_existing": "0",
                "MMD_PER_NAM": "child",
                "last_name": "of mine",
                "gender": "Male",
                "DE_424405": "",
                "DE_2008294": "NVP only",
                "DE_2006098": "4",
                "DE_391382": "",
                "DE_2006101": "1",
                "DE_2006103": "Exclusive",
                "DE_2006104": "0",
                "DE_2005736": "2000",
                "households_note": "",
                "hh_repeat": [
                    {
                        "name": "household 1",
                        "gender": "Male",
                        "age": "42",
                        "street": "streeet 1",
                        "number": "44b",
                        "city": "bxl",
                    },
                    {
                        "name": "household 2",
                        "gender": "Female",
                        "age": "11",
                        "street": "street b",
                        "number": "45",
                        "city": "Namur",
                    },
                ],
                "instanceID": "uuid:87eefa63-7523-479e-bb91-d21aa27cc6e7",
                "_version": "202008121012",
            },
        )

    def test_xml_to_json_should_support_xml_without_version(self):
        instance = m.Instance.objects.create(
            form=self.form_1,
            period="202001",
            org_unit=self.jedi_council_coruscant,
            file=UploadedFile(open("iaso/tests/fixtures/hydroponics_test_upload_without_version.xml")),
        )

        json_instance = instance.get_and_save_json_of_xml()
        self.assertTrue("_version" not in json_instance)

    def test_xml_to_json_should_omit_older_answers(self):
        with open("iaso/tests/fixtures/edit_existing_submission_xlsform.xlsx", "rb") as form_1_version_1_file:
            survey = parsing.parse_xls_form(form_1_version_1_file)
            form_version = m.FormVersion.objects.create_for_form_and_survey(
                form=self.form_1, survey=survey, xls_file=File(form_1_version_1_file)
            )
            form_version.version_id = "2022051101"  # force version to match instance files
            form_version.save()

        instance = m.Instance.objects.create(
            form=self.form_1,
            period="202001",
            org_unit=self.jedi_council_coruscant,
            file=UploadedFile(open("iaso/tests/fixtures/edit_existing_submission.xml")),
        )

        json_instance = instance.get_and_save_json_of_xml()

        # as described in https://bluesquare.atlassian.net/browse/IA-1351
        #
        # these pmns_qlte_cs_rdc_14_total_max and pmns_qlte_cs_rdc_14_total_point
        # were twice in the xml
        #
        # but in the newer version of the form
        #    grp14/synthesis/pmns_qlte_cs_rdc_14_total_max 26
        # and
        #    grp14/synthesis14/pmns_qlte_cs_rdc_14_total_max 13
        # should be ignored (previous version calculate)

        self.assertEquals(json_instance["pmns_qlte_cs_rdc_14_total_max"], "26")
        self.assertEquals(json_instance["pmns_qlte_cs_rdc_14_total_point"], "26")

    def test_instances_for_org_unit_hierarchy(self):
        """Test the querying instances within a specific org unit hierarchy"""

        (
            alderaan,
            sluis,
            dagobah,
            first_council,
            second_council,
            first_academy,
            second_academy,
        ) = self.create_simple_hierarchy()

        for _ in range(7):
            self.create_form_instance(org_unit=alderaan)

        for _ in range(2):
            self.create_form_instance(org_unit=sluis)

        for _ in range(3):
            self.create_form_instance(org_unit=dagobah)

        for _ in range(4):
            self.create_form_instance(org_unit=first_council)
            self.create_form_instance(org_unit=second_council)

        for _ in range(5):
            self.create_form_instance(org_unit=first_academy)

        self.assertEqual(7, m.Instance.objects.for_org_unit_hierarchy(alderaan).count())
        self.assertEqual(18, m.Instance.objects.for_org_unit_hierarchy(sluis).count())
        self.assertEqual(16, m.Instance.objects.for_org_unit_hierarchy(dagobah).count())
        self.assertEqual(9, m.Instance.objects.for_org_unit_hierarchy(first_council).count())
        self.assertEqual(4, m.Instance.objects.for_org_unit_hierarchy(second_council).count())
        self.assertEqual(5, m.Instance.objects.for_org_unit_hierarchy(first_academy).count())
        self.assertEqual(0, m.Instance.objects.for_org_unit_hierarchy(second_academy).count())

        # test with multiple org units
        self.assertEqual(13, m.Instance.objects.for_org_unit_hierarchy([first_council, second_council]).count())
        self.assertEqual(25, m.Instance.objects.for_org_unit_hierarchy([alderaan, sluis]).count())
        self.assertEqual(
            16,  # providing first_council and second_council should have no effect here
            m.Instance.objects.for_org_unit_hierarchy([dagobah, first_council, second_council]).count(),
        )

        # membership sanity checks with a single instance
        instance = self.create_form_instance(org_unit=dagobah)
        self.assertIn(instance, m.Instance.objects.for_org_unit_hierarchy(sluis))
        self.assertIn(instance, m.Instance.objects.for_org_unit_hierarchy(dagobah))
        self.assertNotIn(instance, m.Instance.objects.for_org_unit_hierarchy(first_council))
        self.assertNotIn(instance, m.Instance.objects.for_org_unit_hierarchy(second_council))
        self.assertNotIn(instance, m.Instance.objects.for_org_unit_hierarchy(first_academy))
        self.assertNotIn(instance, m.Instance.objects.for_org_unit_hierarchy(second_academy))

    def create_simple_hierarchy(self):
        alderaan = m.OrgUnit.objects.create(org_unit_type=self.sector, name="Alderaan Sector")
        sluis = m.OrgUnit.objects.create(org_unit_type=self.sector, name="Sluis Sector")
        dagobah = m.OrgUnit.objects.create(org_unit_type=self.system, parent=sluis, name="Dagobah System")
        first_council = m.OrgUnit.objects.create(
            org_unit_type=self.jedi_council, parent=dagobah, name="First Dagobah Jedi Council"
        )
        second_council = m.OrgUnit.objects.create(
            org_unit_type=self.jedi_council, parent=dagobah, name="Second Dagobah Jedi Council"
        )
        first_academy = m.OrgUnit.objects.create(
            org_unit_type=self.jedi_academy, parent=first_council, name="Jedi Academy Dagobah I"
        )
        second_academy = m.OrgUnit.objects.create(
            org_unit_type=self.jedi_academy, parent=first_council, name="Jedi Academy Dagobah II"
        )
        alderaan.save()
        sluis.save()
        dagobah.refresh_from_db()
        first_council.refresh_from_db()
        second_council.refresh_from_db()
        first_academy.refresh_from_db()
        second_academy.refresh_from_db()

        return (alderaan, sluis, dagobah, first_council, second_council, first_academy, second_academy)

    def test_org_unit_soft_delete_no_one(self):
        instance = self.create_form_instance(form=self.form_1, period="202001", org_unit=self.jedi_council_coruscant)

        self.assertFalse(instance.deleted)
        self.assertEqual(0, Modification.objects.count())

        instance.soft_delete()

        self.assertTrue(instance.deleted)
        self.assertEqual(1, Modification.objects.count())
        modification = Modification.objects.first()
        self.assertIsNone(modification.user)
        self.assertEqual(INSTANCE_API, modification.source)
        self.assertEqual(instance.id, int(modification.object_id))
        self.assertNotEqual(modification.past_value, modification.new_value)
        self.assertFalse(modification.past_value[0]["fields"]["deleted"])
        self.assertTrue(modification.new_value[0]["fields"]["deleted"])

    def test_org_unit_soft_delete_someone(self):
        instance = self.create_form_instance(form=self.form_1, period="202002", org_unit=self.jedi_council_coruscant)

        self.assertFalse(instance.deleted)
        self.assertEqual(0, Modification.objects.count())

        instance.soft_delete(user=self.yoda)

        self.assertTrue(instance.deleted)
        self.assertEqual(1, Modification.objects.count())
        modification = Modification.objects.first()
        self.assertEqual(self.yoda, modification.user)


class ReferenceInstanceTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.org_unit_type = m.OrgUnitType.objects.create(name="Sector", short_name="Sec")
        cls.form = m.Form.objects.create(name="Vaccine form")
        cls.org_unit = m.OrgUnit.objects.create(org_unit_type=cls.org_unit_type, name="Org Unit")
        cls.instance = m.Instance.objects.create(form=cls.form, org_unit=cls.org_unit)

    def test_flag_reference_instance_exception_no_form(self):
        instance_without_form = m.Instance.objects.create(form=None, org_unit=None)
        with self.assertRaises(ValidationError) as error:
            instance_without_form.flag_reference_instance(self.org_unit)
        self.assertIn("The Instance must be linked to a Form.", error.exception.message)

    def test_flag_reference_instance_exception_no_orgunittype(self):
        org_unit_without_org_unit_type = m.OrgUnit.objects.create(org_unit_type=None)
        with self.assertRaises(ValidationError) as error:
            self.instance.flag_reference_instance(org_unit_without_org_unit_type)
        self.assertIn("The OrgUnit must be linked to a OrgUnitType.", error.exception.message)

    def test_flag_reference_instance_exception_not_a_reference_form(self):
        form_not_in_reference_forms = m.Form.objects.create(name="Vaccine form")
        instance = m.Instance.objects.create(form=form_not_in_reference_forms, org_unit=self.org_unit)
        with self.assertRaises(ValidationError) as error:
            instance.flag_reference_instance(self.org_unit)
        self.assertIn("The submission must be an instance of a reference form.", error.exception.message)

    def test_flag_reference_instance(self):
        self.org_unit_type.reference_forms.add(self.form)
        org_unit_reference_instance = self.instance.flag_reference_instance(self.org_unit)
        self.assertEqual(1, self.org_unit.reference_instances.count())
        self.assertEqual(org_unit_reference_instance.org_unit, self.org_unit)
        self.assertEqual(org_unit_reference_instance.form, self.form)
        self.assertEqual(org_unit_reference_instance.instance, self.instance)
        self.assertEqual(self.instance, self.org_unit.reference_instances.first())

    def test_unflag_reference_instance(self):
        self.org_unit_type.reference_forms.add(self.form)
        self.instance.flag_reference_instance(self.org_unit)
        self.assertEqual(1, self.org_unit.reference_instances.count())
        self.instance.unflag_reference_instance(self.org_unit)
        self.assertEqual(0, self.org_unit.reference_instances.count())

    def test_is_instance_of_reference_form(self):
        self.assertFalse(self.instance.is_instance_of_reference_form)
        self.org_unit_type.reference_forms.add(self.form)
        self.assertTrue(self.instance.is_instance_of_reference_form)

    def test_is_reference_instance(self):
        self.assertFalse(self.instance.is_reference_instance)
        m.OrgUnitReferenceInstance.objects.create(org_unit=self.org_unit, instance=self.instance, form=self.form)
        self.assertTrue(self.instance.is_reference_instance)
