from iaso.test import APITestCase
from iaso import models as m


class OUCRCAPIBase(APITestCase):
    """
    Test actions on the ViewSet.
    """

    @classmethod
    def setUpTestData(cls):
        cls.account_pokemon = m.Account.objects.create(name="Pokemon")
        cls.app_id = "pokemon"
        cls.project_johto = m.Project.objects.create(
            name="Project Johto", account=cls.account_pokemon, app_id=cls.app_id
        )

        cls.user_ash_ketchum = cls.create_user_with_profile(username="Ash Ketchum", account=cls.account_pokemon)
        cls.user_misty = cls.create_user_with_profile(username="Misty", account=cls.account_pokemon)
        cls.user_brock = cls.create_user_with_profile(username="Brock", account=cls.account_pokemon)

        cls.ou_type_fire_pokemons = m.OrgUnitType.objects.create(name="Fire Pokemons")
        cls.ou_type_fire_pokemons.projects.add(cls.project_johto)
        cls.ou_type_rock_pokemons = m.OrgUnitType.objects.create(name="Rock Pokemons")
        cls.ou_type_rock_pokemons.projects.add(cls.project_johto)
        cls.ou_type_water_pokemons = m.OrgUnitType.objects.create(name="Water Pokemons")
        cls.ou_type_water_pokemons.projects.add(cls.project_johto)

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

        cls.oucrc_type_fire = m.OrgUnitChangeRequestConfiguration.objects.create(
            org_unit_type=cls.ou_type_fire_pokemons,
            project=cls.project_johto,
            created_by=cls.user_ash_ketchum,
            editable_fields=["name", "aliases", "location", "opening_date", "closing_date"],
        )
        cls.oucrc_type_water = m.OrgUnitChangeRequestConfiguration.objects.create(
            org_unit_type=cls.ou_type_water_pokemons,
            project=cls.project_johto,
            created_by=cls.user_misty,
            org_units_editable=False,
        )
        cls.oucrc_type_rock = m.OrgUnitChangeRequestConfiguration.objects.create(
            org_unit_type=cls.ou_type_rock_pokemons,
            project=cls.project_johto,
            created_by=cls.user_brock,
            editable_fields=["name", "aliases", "location"],
        )

        cls.other_group_1 = m.Group.objects.create(name="Other group 1")
        cls.other_group_2 = m.Group.objects.create(name="Other group 2")
        cls.other_group_3 = m.Group.objects.create(name="Other group 3")

        cls.oucrc_type_water.possible_types.set([cls.ou_type_water_pokemons, cls.ou_type_fire_pokemons])
        cls.oucrc_type_water.possible_parent_types.set([cls.ou_type_water_pokemons, cls.ou_type_rock_pokemons])
        cls.oucrc_type_water.group_sets.set([cls.group_set_misty_pokemons])
        cls.oucrc_type_water.editable_reference_forms.set([cls.form_water_gun])
        cls.oucrc_type_water.other_groups.set([cls.other_group_1, cls.other_group_3])
