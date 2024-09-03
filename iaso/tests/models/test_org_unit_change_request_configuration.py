import datetime

import time_machine
from django.core.exceptions import ValidationError
from uuid import uuid4

from iaso import models as m
from iaso.test import TestCase


class OrgUnitChangeRequestConfigurationModelTestCase(TestCase):
    """
    Test OrgUnitChangeRequestConfiguration model.
    """

    DT = datetime.datetime(2023, 10, 18, 17, 0, 0, 0, tzinfo=datetime.timezone.utc)

    @classmethod
    def setUpTestData(cls):
        cls.account_pokemon = m.Account.objects.create(name="Pokemon")
        cls.project_johto = m.Project.objects.create(
            name="Project Johto", account=cls.account_pokemon, app_id="pokemon"
        )

        cls.user_ash_ketchum = cls.create_user_with_profile(username="Ash Ketchum", account=cls.account_pokemon)
        cls.user_misty = cls.create_user_with_profile(username="Misty", account=cls.account_pokemon)
        cls.user_brock = cls.create_user_with_profile(username="Brock", account=cls.account_pokemon)

        cls.ou_type_fire_pokemons = m.OrgUnitType.objects.create(name="Fire Pokemons")
        cls.ou_type_rock_pokemons = m.OrgUnitType.objects.create(name="Rock Pokemons")
        cls.ou_type_water_pokemons = m.OrgUnitType.objects.create(name="Water Pokemons")

        cls.group_set_ash_pokemons = m.GroupSet.objects.create(name="Ash's Pokemons")
        cls.group_set_misty_pokemons = m.GroupSet.objects.create(name="Misty's Pokemons")
        cls.group_set_brock_pokemons = m.GroupSet.objects.create(name="Brock's Pokemons")

        cls.group_season_1 = m.Group.objects.create(name="Season 1")
        cls.group_season_2 = m.Group.objects.create(name="Season 2")
        cls.group_season_3 = m.Group.objects.create(name="Season 3")

        cls.org_unit_charizard = m.OrgUnit.objects.create(
            name="Charizard",
            org_unit_type=cls.ou_type_fire_pokemons,
        )
        cls.org_unit_starmie = m.OrgUnit.objects.create(
            name="Starmie",
            org_unit_type=cls.ou_type_water_pokemons,
        )
        cls.org_unit_onix = m.OrgUnit.objects.create(
            name="Onix",
            org_unit_type=cls.ou_type_rock_pokemons,
        )

        cls.form_ember = m.Form.objects.create(name="Form Ember")
        cls.form_water_gun = m.Form.objects.create(name="Form Water Gun")
        cls.form_rock_throw = m.Form.objects.create(name="Form Rock Throw")

        cls.org_unit_charizard.groups.set([cls.group_season_1])
        cls.org_unit_onix.groups.set([cls.group_season_2])
        cls.org_unit_starmie.groups.set([cls.group_season_3])

        cls.group_set_brock_pokemons.groups.set([cls.group_season_1, cls.group_season_2])
        cls.group_set_ash_pokemons.groups.set([cls.group_season_2, cls.group_season_3])
        cls.group_set_misty_pokemons.groups.set([cls.group_season_1, cls.group_season_3])

    @time_machine.travel(DT, tick=False)
    def test_create_happy_path(self):
        random_uuid = uuid4()
        kwargs = {
            "uuid": str(random_uuid),
            "project": self.project_johto,
            "org_unit_type": self.ou_type_fire_pokemons,
            "org_units_editable": False,
            "editable_fields": [
                "name",
                "aliases",
                "parent_type",
                "org_unit_type",
                "group_sets",
            ],
            "created_by": self.user_ash_ketchum,
        }
        oucrc = m.OrgUnitChangeRequestConfiguration(**kwargs)
        oucrc.full_clean()
        oucrc.save()
        oucrc.possible_types.set([self.ou_type_fire_pokemons, self.ou_type_rock_pokemons])
        oucrc.possible_parent_types.set([self.ou_type_fire_pokemons, self.ou_type_water_pokemons])
        oucrc.possible_group_sets.set([self.group_set_ash_pokemons, self.group_set_misty_pokemons])
        oucrc.editable_reference_forms.set([self.form_ember, self.form_water_gun])
        oucrc.refresh_from_db()

        self.assertEqual(str(oucrc.uuid), str(random_uuid))
        self.assertEqual(oucrc.project, self.project_johto)
        self.assertEqual(oucrc.org_unit_type, self.ou_type_fire_pokemons)
        self.assertFalse(oucrc.org_units_editable)
        self.assertCountEqual(oucrc.editable_fields, kwargs["editable_fields"])
        self.assertEqual(oucrc.created_by, self.user_ash_ketchum)
        self.assertEqual(oucrc.created_at, self.DT)
        self.assertEqual(oucrc.updated_at, self.DT)
        self.assertIsNone(oucrc.updated_by)
        self.assertCountEqual(oucrc.possible_types.all(), [self.ou_type_fire_pokemons, self.ou_type_rock_pokemons])
        self.assertCountEqual(
            oucrc.possible_parent_types.all(), [self.ou_type_fire_pokemons, self.ou_type_water_pokemons]
        )
        self.assertCountEqual(
            oucrc.possible_group_sets.all(), [self.group_set_ash_pokemons, self.group_set_misty_pokemons]
        )
        self.assertCountEqual(oucrc.editable_reference_forms.all(), [self.form_ember, self.form_water_gun])

    def test_create_without_any_data_restriction(self):
        random_uuid = uuid4()
        kwargs = {
            "uuid": str(random_uuid),
            "project": self.project_johto,
            "org_unit_type": self.ou_type_water_pokemons,
            "editable_fields": m.OrgUnitChangeRequestConfiguration.LIST_OF_POSSIBLE_EDITABLE_FIELDS,
            "created_by": self.user_misty,
        }
        oucrc = m.OrgUnitChangeRequestConfiguration(**kwargs)
        oucrc.full_clean()
        oucrc.save()

        self.assertEqual(str(oucrc.uuid), str(random_uuid))
        self.assertEqual(oucrc.project, self.project_johto)
        self.assertEqual(oucrc.org_unit_type, self.ou_type_water_pokemons)
        self.assertTrue(oucrc.org_units_editable)
        self.assertCountEqual(oucrc.editable_fields, kwargs["editable_fields"])
        self.assertEqual(oucrc.created_by, self.user_misty)
        self.assertFalse(oucrc.possible_parent_types.exists())
        self.assertFalse(oucrc.possible_group_sets.exists())
        self.assertFalse(oucrc.editable_reference_forms.exists())

    def test_create_error_same_project_and_orgunit_type(self):
        random_uuid = uuid4()
        kwargs_1 = {
            "uuid": str(random_uuid),
            "project": self.project_johto,
            "org_unit_type": self.ou_type_rock_pokemons,
            "editable_fields": [],
            "created_by": self.user_brock,
        }
        oucrc_1 = m.OrgUnitChangeRequestConfiguration(**kwargs_1)
        oucrc_1.full_clean()
        oucrc_1.save()

        self.assertEqual(str(oucrc_1.uuid), str(random_uuid))
        self.assertEqual(oucrc_1.project, self.project_johto)
        self.assertEqual(oucrc_1.org_unit_type, self.ou_type_rock_pokemons)
        self.assertCountEqual(oucrc_1.editable_fields, kwargs_1["editable_fields"])
        self.assertEqual(oucrc_1.created_by, self.user_brock)

        another_random_uuid = uuid4()
        kwargs_2 = {
            "uuid": str(another_random_uuid),
            "project": self.project_johto,
            "org_unit_type": self.ou_type_rock_pokemons,
            "editable_fields": ["name"],
            "created_by": self.user_ash_ketchum,
        }
        oucrc_2 = m.OrgUnitChangeRequestConfiguration(**kwargs_2)
        with self.assertRaises(ValidationError) as error:
            oucrc_2.full_clean()
            oucrc_2.save()

        self.assertIn(
            "Org unit change request configuration with this Project and Org unit type already exists.",
            error.exception.messages,
        )

    def test_create_error_invalid_editable_fields(self):
        pikachu = "PIKACHU"
        random_uuid = uuid4()
        kwargs = {
            "uuid": str(random_uuid),
            "project": self.project_johto,
            "org_unit_type": self.ou_type_water_pokemons,
            "editable_fields": ["name", "aliases", pikachu, "group_sets"],
            "created_by": self.user_ash_ketchum,
        }

        oucrc = m.OrgUnitChangeRequestConfiguration(**kwargs)
        with self.assertRaises(ValidationError) as error:
            oucrc.full_clean()
            oucrc.save()

        self.assertIn(f"Value {pikachu} is not a valid choice.", error.exception.messages)

    def test_filtering_for_user(self):
        # Preparing first OUCRC on default account
        random_uuid = uuid4()
        kwargs = {
            "uuid": str(random_uuid),
            "project": self.project_johto,
            "org_unit_type": self.ou_type_water_pokemons,
            "editable_fields": [],
            "created_by": self.user_misty,
        }
        oucrc = m.OrgUnitChangeRequestConfiguration(**kwargs)
        oucrc.full_clean()
        oucrc.save()

        # Setup for second account
        new_account_digimon = m.Account.objects.create(name="Digimon")
        new_project_digital_world = m.Project.objects.create(
            name="Digital World", account=new_account_digimon, app_id="digimon"
        )
        new_user_tai_kamiya = self.create_user_with_profile(username="Tai Kamiya", account=new_account_digimon)
        new_ou_type_dinosaur_digimons = m.OrgUnitType.objects.create(name="Dinosaur Digimons")

        # Preparing a second OUCRC on second account
        another_random_uuid = uuid4()
        new_kwargs = {
            "uuid": str(another_random_uuid),
            "project": new_project_digital_world,
            "org_unit_type": new_ou_type_dinosaur_digimons,
            "editable_fields": [],
            "created_by": new_user_tai_kamiya,
        }
        new_oucrc = m.OrgUnitChangeRequestConfiguration(**new_kwargs)
        new_oucrc.full_clean()
        new_oucrc.save()

        oucrcs_from_pokemon = m.OrgUnitChangeRequestConfiguration.objects.filter_for_user(self.user_misty)
        oucrcs_from_digimon = m.OrgUnitChangeRequestConfiguration.objects.filter_for_user(new_user_tai_kamiya)
        all_oucrcs = m.OrgUnitChangeRequestConfiguration.objects.all()

        self.assertCountEqual([oucrc], oucrcs_from_pokemon)
        self.assertCountEqual([new_oucrc], oucrcs_from_digimon)
        self.assertCountEqual([oucrc, new_oucrc], all_oucrcs)
