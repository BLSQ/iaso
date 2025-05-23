from iaso import models as m
from iaso.test import APITestCase


class OUCRCAPIBase(APITestCase):
    """
    Test actions on the ViewSet.
    """

    OUCRC_API_URL = "/api/orgunits/changes/configs/"

    @classmethod
    def setUpTestData(cls):
        cls.data_source_pokemon = m.DataSource.objects.create(name="DataSource Pokémon")
        cls.source_version_1_pokemon = m.SourceVersion.objects.create(data_source=cls.data_source_pokemon, number=1)
        cls.account_pokemon = m.Account.objects.create(name="Pokemon", default_version=cls.source_version_1_pokemon)
        cls.app_id = "pokemon"
        cls.project_johto = m.Project.objects.create(
            name="Project Johto", account=cls.account_pokemon, app_id=cls.app_id
        )
        cls.data_source_pokemon.projects.set([cls.project_johto])

        cls.user_ash_ketchum = cls.create_user_with_profile(
            username="Ash Ketchum",
            account=cls.account_pokemon,
            permissions=["iaso_org_unit_change_request_configurations"],
        )
        cls.user_misty = cls.create_user_with_profile(
            username="Misty",
            account=cls.account_pokemon,
            permissions=["iaso_org_unit_change_request_configurations"],
            projects=[cls.project_johto],
        )
        cls.user_brock = cls.create_user_with_profile(
            username="Brock",
            account=cls.account_pokemon,
            permissions=["iaso_org_unit_change_request_configurations"],
            projects=[cls.project_johto],
        )
        cls.user_without_perms_giovanni = cls.create_user_with_profile(username="Giovanni", account=cls.account_pokemon)

        cls.ou_type_fire_pokemons = m.OrgUnitType.objects.create(name="Fire Pokemons")
        cls.ou_type_fire_pokemons.projects.add(cls.project_johto)
        cls.ou_type_rock_pokemons = m.OrgUnitType.objects.create(name="Rock Pokemons")
        cls.ou_type_rock_pokemons.projects.add(cls.project_johto)
        cls.ou_type_water_pokemons = m.OrgUnitType.objects.create(name="Water Pokemons")
        cls.ou_type_water_pokemons.projects.add(cls.project_johto)

        cls.group_set_ash_pokemons = m.GroupSet.objects.create(
            name="Ash's Pokemons", source_version=cls.source_version_1_pokemon
        )
        cls.group_set_misty_pokemons = m.GroupSet.objects.create(
            name="Misty's Pokemons", source_version=cls.source_version_1_pokemon
        )
        cls.group_set_brock_pokemons = m.GroupSet.objects.create(
            name="Brock's Pokemons", source_version=cls.source_version_1_pokemon
        )

        cls.group_season_1 = m.Group.objects.create(name="Season 1", source_version=cls.source_version_1_pokemon)
        cls.group_season_2 = m.Group.objects.create(name="Season 2", source_version=cls.source_version_1_pokemon)
        cls.group_season_3 = m.Group.objects.create(name="Season 3", source_version=cls.source_version_1_pokemon)

        cls.org_unit_charizard = m.OrgUnit.objects.create(
            name="Charizard",
            org_unit_type=cls.ou_type_fire_pokemons,
        )
        cls.org_unit_charizard.groups.set([cls.group_season_1])
        cls.org_unit_starmie = m.OrgUnit.objects.create(
            name="Starmie",
            org_unit_type=cls.ou_type_water_pokemons,
        )
        cls.org_unit_starmie.groups.set([cls.group_season_3])
        cls.org_unit_onix = m.OrgUnit.objects.create(
            name="Onix",
            org_unit_type=cls.ou_type_rock_pokemons,
        )
        cls.org_unit_onix.groups.set([cls.group_season_2])

        cls.form_ember = m.Form.objects.create(name="Form Ember")
        cls.form_ember.projects.set([cls.project_johto])
        cls.form_water_gun = m.Form.objects.create(name="Form Water Gun")
        cls.form_water_gun.projects.set([cls.project_johto])
        cls.form_rock_throw = m.Form.objects.create(name="Form Rock Throw")
        cls.form_rock_throw.projects.set([cls.project_johto])

        cls.group_set_brock_pokemons.groups.set([cls.group_season_1, cls.group_season_2])
        cls.group_set_ash_pokemons.groups.set([cls.group_season_2, cls.group_season_3])
        cls.group_set_misty_pokemons.groups.set([cls.group_season_1, cls.group_season_3])

        cls.oucrc_type_fire = m.OrgUnitChangeRequestConfiguration.objects.create(
            org_unit_type=cls.ou_type_fire_pokemons,
            project=cls.project_johto,
            type=m.OrgUnitChangeRequestConfiguration.Type.EDITION,
            created_by=cls.user_ash_ketchum,
            editable_fields=["name", "aliases", "location", "opening_date", "closing_date"],
        )
        cls.oucrc_type_fire_creation = m.OrgUnitChangeRequestConfiguration.objects.create(
            org_unit_type=cls.ou_type_fire_pokemons,
            project=cls.project_johto,
            type=m.OrgUnitChangeRequestConfiguration.Type.CREATION,
            created_by=cls.user_ash_ketchum,
            editable_fields=["name", "aliases", "location", "opening_date", "closing_date"],
        )
        cls.oucrc_type_water = m.OrgUnitChangeRequestConfiguration.objects.create(
            org_unit_type=cls.ou_type_water_pokemons,
            project=cls.project_johto,
            type=m.OrgUnitChangeRequestConfiguration.Type.EDITION,
            created_by=cls.user_misty,
            org_units_editable=False,
        )
        cls.oucrc_type_water_creation = m.OrgUnitChangeRequestConfiguration.objects.create(
            org_unit_type=cls.ou_type_water_pokemons,
            project=cls.project_johto,
            type=m.OrgUnitChangeRequestConfiguration.Type.CREATION,
            created_by=cls.user_misty,
            org_units_editable=False,
        )
        cls.oucrc_type_rock = m.OrgUnitChangeRequestConfiguration.objects.create(
            org_unit_type=cls.ou_type_rock_pokemons,
            project=cls.project_johto,
            type=m.OrgUnitChangeRequestConfiguration.Type.EDITION,
            created_by=cls.user_brock,
            editable_fields=["name", "aliases", "location"],
        )
        cls.oucrc_type_rock_creation = m.OrgUnitChangeRequestConfiguration.objects.create(
            org_unit_type=cls.ou_type_rock_pokemons,
            project=cls.project_johto,
            type=m.OrgUnitChangeRequestConfiguration.Type.CREATION,
            created_by=cls.user_brock,
            editable_fields=["name", "aliases", "location"],
        )

        cls.other_group_film_1 = m.Group.objects.create(name="Film 1", source_version=cls.source_version_1_pokemon)
        cls.other_group_film_2 = m.Group.objects.create(name="Film 2", source_version=cls.source_version_1_pokemon)
        cls.other_group_film_3 = m.Group.objects.create(name="Film 3", source_version=cls.source_version_1_pokemon)

        cls.oucrc_type_fire.possible_types.set([cls.ou_type_rock_pokemons, cls.ou_type_fire_pokemons])
        cls.oucrc_type_fire.possible_parent_types.set([cls.ou_type_fire_pokemons, cls.ou_type_rock_pokemons])
        cls.oucrc_type_fire.group_sets.set([cls.group_set_ash_pokemons])
        cls.oucrc_type_fire.editable_reference_forms.set([cls.form_ember])
        cls.oucrc_type_fire.other_groups.set([cls.other_group_film_1, cls.other_group_film_3])
