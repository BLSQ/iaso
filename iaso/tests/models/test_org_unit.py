from django.contrib.gis.geos import Point
from django.db import IntegrityError, InternalError, connections
from django.db.models import Q

from iaso import models as m
from iaso.models.org_unit import OrgUnitQuerySet
from iaso.test import TestCase


class OrgUnitTypeModelTestCase(TestCase):
    """OrgUnitType: tests at the business logic/model level"""

    @classmethod
    def setUpTestData(cls):
        cls.account = m.Account.objects.create(name="a")
        cls.project = m.Project.objects.create(name="Project 1", account=cls.account, app_id="test_app_id")
        cls.setup_out = m.OrgUnitType.objects.create(name="AS", depth=4)
        cls.setup_out.projects.add(cls.project)


class OrgUnitManagerTestCase(TestCase):
    def test_parents_q(self):
        country = m.OrgUnit.objects.create(
            name="ANGOLA",
            org_unit_type=m.OrgUnitType.objects.create(category="COUNTRY"),
            validation_status=m.OrgUnit.VALIDATION_VALID,
            path=["foo"],
        )
        region = m.OrgUnit.objects.create(
            name="HUILA",
            parent=country,
            org_unit_type=m.OrgUnitType.objects.create(category="REGION"),
            validation_status=m.OrgUnit.VALIDATION_VALID,
            path=["foo", "bar"],
        )
        district = m.OrgUnit.objects.create(
            name="CUVANGO",
            parent=region,
            org_unit_type=m.OrgUnitType.objects.create(category="DISTRICT"),
            validation_status=m.OrgUnit.VALIDATION_VALID,
            path=["foo", "bar", "baz"],
        )
        district.calculate_paths()
        q = m.OrgUnit.objects.parents_q(m.OrgUnit.objects.all())

        self.assertIsInstance(q, Q)
        path, args, kwargs = q.deconstruct()
        self.assertEqual(path, "django.db.models.Q")
        self.assertIn(("path__ancestors", country.path), args)
        self.assertIn(("path__ancestors", region.path), args)
        self.assertIn(("path__ancestors", district.path), args)
        self.assertEqual(kwargs, {"_connector": "OR"})


class OrgUnitModelTestCase(TestCase):
    """OrgUnit: tests at the business logic/model level"""

    @classmethod
    def setUpTestData(cls):
        cls.sector = m.OrgUnitType.objects.create(name="Sector", short_name="Sec")
        cls.system = m.OrgUnitType.objects.create(name="System", short_name="Sys")
        cls.jedi_council = m.OrgUnitType.objects.create(name="Jedi Council", short_name="Cnc")
        cls.jedi_task_force = m.OrgUnitType.objects.create(name="Jedi Task Force", short_name="Jtf")

    def test_org_unit_creation_no_parent_or_parent_has_path(self):
        """Newly created org unit without parents should have a path, and so do new org units
        attached to a parent that has a path."""

        corrusca = m.OrgUnit.objects.create(org_unit_type=self.sector, name="Corrusca Sector")
        corruscant = m.OrgUnit.objects.create(parent=corrusca, org_unit_type=self.sector, name="Corruscant System")
        self.assertEqual(str(corrusca.path), str(corrusca.pk))
        self.assertEqual(str(corruscant.path), f"{corrusca.pk}.{corruscant.pk}")

    def test_org_unit_creation_or_update_parent_without_path(self):
        """Created or updated a org unit linked to a pathless parent should not have a path."""

        corrusca = m.OrgUnit(org_unit_type=self.sector, name="Corrusca Sector")
        corrusca.save(skip_calculate_path=True)
        corruscant = m.OrgUnit.objects.create(parent=corrusca, org_unit_type=self.sector, name="Corruscant System")
        self.assertIsNone(corruscant.path)
        corruscant.save()
        self.assertIsNone(corruscant.path)

    def test_org_unit_update_path_with_children(self):
        """Path should be set for the whole hierarchy"""

        corrusca = m.OrgUnit(org_unit_type=self.sector, name="Corrusca Sector")
        corrusca.save(skip_calculate_path=True)
        corruscant = m.OrgUnit(org_unit_type=self.system, parent=corrusca, name="Coruscant System")
        corruscant.save(skip_calculate_path=True)
        jedi_council_corruscant = m.OrgUnit(
            org_unit_type=self.jedi_council, parent=corruscant, name="Corruscant Jedi Council"
        )
        jedi_council_corruscant.save(skip_calculate_path=True)

        self.assertIsNone(corrusca.path)
        self.assertIsNone(corruscant.path)
        self.assertIsNone(jedi_council_corruscant.path)

        # 2 savepoints, 1 regular update, 3 "get children" queries, 1 bulk update
        with self.assertNumQueries(7):
            corrusca.save(update_fields=["path"])

        corruscant.refresh_from_db()
        jedi_council_corruscant.refresh_from_db()

        self.assertEqual(str(corrusca.path), str(corrusca.pk))
        self.assertEqual(str(corruscant.path), f"{corrusca.pk}.{corruscant.pk}")
        self.assertEqual(
            str(jedi_council_corruscant.path), f"{corrusca.pk}.{corruscant.pk}.{jedi_council_corruscant.pk}"
        )

    def test_org_unit_path_does_not_change(self):
        """Updating the "name" property should not result in path change queries"""

        corrusca = m.OrgUnit.objects.create(org_unit_type=self.sector, name="Corrusca Sector")
        corruscant = m.OrgUnit.objects.create(org_unit_type=self.system, parent=corrusca, name="Coruscant System")
        m.OrgUnit.objects.create(org_unit_type=self.jedi_council, parent=corruscant, name="Corruscant Jedi Council")

        corrusca.name = "Corrusca Sector FTW"
        # 2 savepoints, 1 regular update
        with self.assertNumQueries(3):
            corrusca.save()

    def test_org_unit_save_skip_calculate_path(self):
        """If skip_calculate_path is set to True, path should be None, and no transaction should be created"""

        # create
        corrusca = m.OrgUnit(org_unit_type=self.sector, name="Corrusca Sector")
        with self.assertNumQueries(1):
            corrusca.save(skip_calculate_path=True)

        # update
        corrusca.name = "Corrusca Sector FTW"
        with self.assertNumQueries(1):
            corrusca.save(skip_calculate_path=True)

    def test_org_unit_path_does_change(self):
        """Changing the parent should trigger a path update"""

        alderaan = m.OrgUnit.objects.create(org_unit_type=self.sector, name="Alderaan Sector")
        corrusca = m.OrgUnit.objects.create(org_unit_type=self.sector, name="Corrusca Sector")
        corruscant = m.OrgUnit.objects.create(org_unit_type=self.system, parent=alderaan, name="Coruscant System")
        m.OrgUnit.objects.create(org_unit_type=self.jedi_council, parent=corruscant, name="Corruscant Jedi Council")

        corruscant.name = "The awesome Coruscant System"
        corruscant.parent = corrusca

        # 2 savepoints, 1 regular update, 2 children, 1 bulk update
        with self.assertNumQueries(6):
            corruscant.save()

    def test_org_unit_hierarchy_children_descendants(self):
        """Test manager methods: hierarchy(), children() and descendants()."""

        (corrusca, corruscant, first_council, second_council, task_force) = self.create_simple_hierarchy()

        self.assertEqual(5, m.OrgUnit.objects.hierarchy(corrusca).count())
        self.assertEqual(5, m.OrgUnit.objects.hierarchy(m.OrgUnit.objects.filter(name__icontains="corrus")).count())
        self.assertEqual(1, m.OrgUnit.objects.children(corrusca).count())
        self.assertEqual(4, m.OrgUnit.objects.descendants(corrusca).count())

        self.assertEqual(4, m.OrgUnit.objects.hierarchy(corruscant).count())
        self.assertEqual(2, m.OrgUnit.objects.children(corruscant).count())
        self.assertEqual(3, m.OrgUnit.objects.descendants(corruscant).count())

        self.assertEqual(2, m.OrgUnit.objects.hierarchy(first_council).count())
        self.assertEqual(3, m.OrgUnit.objects.hierarchy([first_council, second_council]).count())
        self.assertEqual(1, m.OrgUnit.objects.children(first_council).count())
        self.assertEqual(1, m.OrgUnit.objects.descendants(first_council).count())

        self.assertEqual(1, m.OrgUnit.objects.hierarchy(task_force).count())
        self.assertEqual(0, m.OrgUnit.objects.children(task_force).count())
        self.assertEqual(0, m.OrgUnit.objects.descendants(task_force).count())

        # membership sanity checks
        self.assertIn(first_council, m.OrgUnit.objects.hierarchy(corrusca))
        self.assertNotIn(first_council, m.OrgUnit.objects.children(corrusca))
        self.assertIn(first_council, m.OrgUnit.objects.descendants(corrusca))
        self.assertIn(first_council, m.OrgUnit.objects.hierarchy(corruscant))
        self.assertIn(first_council, m.OrgUnit.objects.children(corruscant))
        self.assertIn(first_council, m.OrgUnit.objects.descendants(corruscant))
        self.assertIn(first_council, m.OrgUnit.objects.hierarchy(first_council))
        self.assertNotIn(first_council, m.OrgUnit.objects.children(first_council))
        self.assertNotIn(first_council, m.OrgUnit.objects.descendants(first_council))
        self.assertNotIn(first_council, m.OrgUnit.objects.hierarchy(second_council))
        self.assertNotIn(first_council, m.OrgUnit.objects.children(second_council))
        self.assertNotIn(first_council, m.OrgUnit.objects.descendants(second_council))
        self.assertNotIn(first_council, m.OrgUnit.objects.hierarchy(task_force))
        self.assertNotIn(first_council, m.OrgUnit.objects.children(task_force))
        self.assertNotIn(first_council, m.OrgUnit.objects.descendants(task_force))

    def test_org_unit_ancestors(self):
        """Test model method: ancestors(). The org unit itself is included."""

        (corrusca, corruscant, first_council, second_council, task_force) = self.create_simple_hierarchy()

        self.assertIsInstance(corrusca.ancestors(), OrgUnitQuerySet)

        self.assertCountEqual([corrusca], corrusca.ancestors())
        self.assertCountEqual([corrusca, corruscant], corruscant.ancestors())
        self.assertCountEqual([corrusca, corruscant, first_council], first_council.ancestors())
        self.assertCountEqual([corrusca, corruscant, second_council], second_council.ancestors())
        self.assertCountEqual([corrusca, corruscant, first_council, task_force], task_force.ancestors())

    def test_org_unit_descendants(self):
        """Test model method: descendants(). The org unit itself is included."""

        (corrusca, corruscant, first_council, second_council, task_force) = self.create_simple_hierarchy()

        self.assertIsInstance(corrusca.descendants(), OrgUnitQuerySet)

        self.assertCountEqual([corrusca, corruscant, first_council, second_council, task_force], corrusca.descendants())
        self.assertCountEqual([corruscant, first_council, second_council, task_force], corruscant.descendants())
        self.assertCountEqual([first_council, task_force], first_council.descendants())
        self.assertCountEqual([second_council], second_council.descendants())
        self.assertCountEqual([task_force], task_force.descendants())

    def test_org_unit_children(self):
        """Test model method: children(). Only the direct children, the org unit itself is excluded."""

        (corrusca, corruscant, first_council, second_council, task_force) = self.create_simple_hierarchy()

        self.assertIsInstance(corrusca.children(), OrgUnitQuerySet)

        self.assertCountEqual([corruscant], corrusca.children())
        self.assertCountEqual([first_council, second_council], corruscant.children())
        self.assertCountEqual([task_force], first_council.children())
        self.assertCountEqual([], second_council.children())
        self.assertCountEqual([], task_force.children())

    def test_org_unit_tree_methods_dont_leak_into_other_trees(self):
        """ancestors(), descendants() and children() stay within the org unit's own tree."""

        (corrusca, corruscant, first_council, second_council, task_force) = self.create_simple_hierarchy()
        alderaan = m.OrgUnit.objects.create(org_unit_type=self.sector, name="Alderaan Sector")
        alderaan_system = m.OrgUnit.objects.create(org_unit_type=self.system, parent=alderaan, name="Alderaan System")
        alderaan.refresh_from_db()
        alderaan_system.refresh_from_db()

        self.assertCountEqual([alderaan, alderaan_system], alderaan.descendants())
        self.assertCountEqual([alderaan, alderaan_system], alderaan_system.ancestors())
        self.assertCountEqual([alderaan_system], alderaan.children())
        self.assertCountEqual([corrusca, corruscant, first_council, second_council, task_force], corrusca.descendants())

    def test_org_unit_tree_methods_with_more_than_10_siblings(self):
        """Paths labels are compared as text by ltree ("10" < "2"): the results must not depend on it."""

        corrusca = m.OrgUnit.objects.create(org_unit_type=self.sector, name="Corrusca Sector")
        systems = [
            m.OrgUnit.objects.create(org_unit_type=self.system, parent=corrusca, name=f"System {i}") for i in range(12)
        ]
        councils = [
            m.OrgUnit.objects.create(org_unit_type=self.jedi_council, parent=system, name=f"Council {i}")
            for i, system in enumerate(systems)
        ]
        corrusca.refresh_from_db()
        for org_unit in [*systems, *councils]:
            org_unit.refresh_from_db()

        self.assertCountEqual(systems, corrusca.children())
        self.assertCountEqual([corrusca, *systems, *councils], corrusca.descendants())
        for system, council in zip(systems, councils, strict=True):
            self.assertCountEqual([council], system.children())
            self.assertCountEqual([system, council], system.descendants())
            self.assertCountEqual([corrusca, system, council], council.ancestors())
            self.assertEqual(corrusca, council.root())

    def test_org_unit_root(self):
        """Test model method: root(). The top of the pyramid, None for a root or an org unit without path."""

        (corrusca, corruscant, first_council, second_council, task_force) = self.create_simple_hierarchy()

        self.assertIsNone(corrusca.root())
        self.assertEqual(corrusca, corruscant.root())
        self.assertEqual(corrusca, first_council.root())
        self.assertEqual(corrusca, second_council.root())
        self.assertEqual(corrusca, task_force.root())

        pathless = m.OrgUnit(org_unit_type=self.sector, name="Pathless Sector")
        pathless.save(skip_calculate_path=True)
        self.assertIsNone(pathless.root())

    def test_org_unit_root_after_reparenting(self):
        """root() is the shallowest ancestor, even when it was created after its descendants (smaller pks)."""

        system = m.OrgUnit.objects.create(org_unit_type=self.system, name="Coruscant System")
        council = m.OrgUnit.objects.create(org_unit_type=self.jedi_council, parent=system, name="Jedi Council")
        sector = m.OrgUnit.objects.create(org_unit_type=self.sector, name="Corrusca Sector")
        self.assertLess(system.pk, sector.pk)

        system.parent = sector
        system.save()
        system.refresh_from_db()
        council.refresh_from_db()

        self.assertEqual(f"{sector.pk}.{system.pk}.{council.pk}", str(council.path))
        self.assertEqual(sector, system.root())
        self.assertEqual(sector, council.root())

    def test_org_unit_country_ancestors(self):
        """Test model method: country_ancestors(). The ancestors (itself included) of the COUNTRY category."""

        country_type = m.OrgUnitType.objects.create(name="Country", short_name="Cnt", category="COUNTRY")
        region_type = m.OrgUnitType.objects.create(name="Region", short_name="Reg", category="REGION")
        country = m.OrgUnit.objects.create(org_unit_type=country_type, name="Angola")
        region = m.OrgUnit.objects.create(org_unit_type=region_type, parent=country, name="Huila")
        other_country = m.OrgUnit.objects.create(org_unit_type=country_type, name="Benin")
        country.refresh_from_db()
        region.refresh_from_db()
        other_country.refresh_from_db()

        self.assertIsInstance(region.country_ancestors(), OrgUnitQuerySet)
        self.assertCountEqual([country], region.country_ancestors())
        self.assertCountEqual([country], country.country_ancestors())
        self.assertCountEqual([other_country], other_country.country_ancestors())

        pathless = m.OrgUnit(org_unit_type=region_type, name="Pathless Region")
        pathless.save(skip_calculate_path=True)
        self.assertIsNone(pathless.country_ancestors())

    def test_org_unit_delete_leaf(self):
        """Deleting an org unit without children deletes only this org unit, other paths are untouched."""

        (corrusca, corruscant, first_council, second_council, task_force) = self.create_simple_hierarchy()
        paths_before = {ou.pk: str(ou.path) for ou in m.OrgUnit.objects.exclude(pk=second_council.pk)}

        second_council.delete()

        self.assertFalse(m.OrgUnit.objects.filter(pk=second_council.pk).exists())
        paths_after = {ou.pk: str(ou.path) for ou in m.OrgUnit.objects.all()}
        self.assertEqual(paths_before, paths_after)

    def create_simple_hierarchy(self):
        corrusca = m.OrgUnit.objects.create(org_unit_type=self.sector, name="Corrusca Sector")
        corruscant = m.OrgUnit.objects.create(org_unit_type=self.system, parent=corrusca, name="Coruscant System")
        first_council = m.OrgUnit.objects.create(
            org_unit_type=self.jedi_council, parent=corruscant, name="First Corruscant Jedi Council"
        )
        second_council = m.OrgUnit.objects.create(
            org_unit_type=self.jedi_council, parent=corruscant, name="Second Corruscant Jedi Council"
        )
        task_force = m.OrgUnit.objects.create(
            org_unit_type=self.jedi_task_force, parent=first_council, name="Jedi Ethics Task Force"
        )
        corrusca.refresh_from_db()
        corruscant.refresh_from_db()
        first_council.refresh_from_db()
        second_council.refresh_from_db()
        task_force.refresh_from_db()

        return corrusca, corruscant, first_council, second_council, task_force

    def test_same_code_different_versions_valid_status(self):
        # Checks that the same code can be used multiple times in different source versions
        code = "chuck norris is stronger than database constraints"
        source = m.DataSource.objects.create(name="source")
        version1 = m.SourceVersion.objects.create(data_source=source, number=1)
        version2 = m.SourceVersion.objects.create(data_source=source, number=2)

        org_unit_1 = m.OrgUnit.objects.create(
            name="OrgUnit 1",
            org_unit_type=self.sector,
            version=version1,
            code=code,
        )
        org_unit_2 = m.OrgUnit.objects.create(
            name="OrgUnit 2",
            org_unit_type=self.sector,
            version=version2,
            code=code,
        )
        # No IntegrityError should be raised -> 2 org units are created
        total_count = m.OrgUnit.objects.count()
        self.assertEqual(total_count, 2)
        self.assertEqual(org_unit_1.code, org_unit_2.code)

    def test_same_code_different_versions_various_statuses(self):
        code = "chuck norris is stronger than database constraints"
        source = m.DataSource.objects.create(name="source")
        version1 = m.SourceVersion.objects.create(data_source=source, number=1)
        version2 = m.SourceVersion.objects.create(data_source=source, number=2)

        org_unit_valid_1 = m.OrgUnit.objects.create(
            name="OrgUnit valid 1",
            org_unit_type=self.sector,
            version=version1,
            code=code,
            validation_status=m.OrgUnit.VALIDATION_VALID,
        )
        org_unit_valid_2 = m.OrgUnit.objects.create(
            name="OrgUnit valid 2",
            org_unit_type=self.sector,
            version=version2,
            code=code,
            validation_status=m.OrgUnit.VALIDATION_VALID,
        )
        org_unit_new_1 = m.OrgUnit.objects.create(
            name="OrgUnit new 1",
            org_unit_type=self.sector,
            version=version1,
            code=code,
            validation_status=m.OrgUnit.VALIDATION_NEW,
        )
        org_unit_new_2 = m.OrgUnit.objects.create(
            name="OrgUnit new 2",
            org_unit_type=self.sector,
            version=version2,
            code=code,
            validation_status=m.OrgUnit.VALIDATION_NEW,
        )
        org_unit_rejected_1 = m.OrgUnit.objects.create(
            name="OrgUnit rejected 1",
            org_unit_type=self.sector,
            version=version1,
            code=code,
            validation_status=m.OrgUnit.VALIDATION_REJECTED,
        )
        org_unit_rejected_2 = m.OrgUnit.objects.create(
            name="OrgUnit rejected 2",
            org_unit_type=self.sector,
            version=version2,
            code=code,
            validation_status=m.OrgUnit.VALIDATION_REJECTED,
        )

        # No IntegrityError should be raised -> 6 org units are created
        total_count = m.OrgUnit.objects.count()
        self.assertEqual(total_count, 6)
        self.assertEqual(org_unit_valid_1.code, org_unit_valid_2.code)
        self.assertEqual(org_unit_valid_1.code, org_unit_new_1.code)
        self.assertEqual(org_unit_valid_1.code, org_unit_new_2.code)
        self.assertEqual(org_unit_valid_1.code, org_unit_rejected_1.code)
        self.assertEqual(org_unit_valid_1.code, org_unit_rejected_2.code)


class OrgUnitModelDbTestCase(TestCase):
    """OrgUnit: tests at the database (constraints, ...) level"""

    @classmethod
    def setUpTestData(cls):
        cls.sector = m.OrgUnitType.objects.create(name="Sector", short_name="Sec")
        cls.source = m.DataSource.objects.create(name="source")
        cls.version1 = m.SourceVersion.objects.create(data_source=cls.source, number=1)
        cls.version2 = m.SourceVersion.objects.create(data_source=cls.source, number=2)
        cls.account = m.Account.objects.create(name="a", default_version=cls.version1)

    def activate_constraints(self):
        """Active constraints inside the test, so that it raise in real time

        Kind of a hack but need to check the constraints, otherwise Django only check them
        at teardown, and we can't catch them.

        This will be automatically reversed in teardown. Only tested with postgres
        Note that the transaction will be blocked once an error occur
        """
        for db_name in reversed(self._databases_names()):
            if self._should_check_constraints(connections[db_name]):
                connections[db_name].cursor().execute("SET CONSTRAINTS ALL IMMEDIATE")

    def test_create_same_then_mod_group(self):
        self.activate_constraints()
        orgunit = m.OrgUnit.objects.create(org_unit_type=self.sector, name="OrgUnit", version=self.version1)
        group = m.Group.objects.create(name="group", source_version=self.version1)
        orgunit.groups.set([group])

        group.source_version = self.version2
        with self.assertRaisesMessage(
            InternalError,
            "Constraint violation iaso_group_org_units_same_source_version_constraint",
        ):
            group.save()

    def test_create_same_then_mod_org_unit(self):
        self.activate_constraints()
        orgunit = m.OrgUnit.objects.create(org_unit_type=self.sector, name="OrgUnit", version=self.version1)
        group = m.Group.objects.create(name="group", source_version=self.version1)
        orgunit.groups.set([group])

        orgunit.version = self.version2
        with self.assertRaisesMessage(
            InternalError,
            "Constraint violation iaso_group_org_units_same_source_version_constraint",
        ):
            orgunit.save()

    def test_diff_source_version_fail_at_assign(self):
        self.activate_constraints()
        orgunit = m.OrgUnit.objects.create(org_unit_type=self.sector, name="OrgUnit", version=self.version1)
        group = m.Group.objects.create(name="group", source_version=self.version2)

        with self.assertRaisesMessage(
            InternalError,
            "Constraint violation iaso_group_org_units_same_source_version_constraint",
        ):
            orgunit.groups.set([group])

    def test_empty_geom(self):
        #  regression test for IA-1326
        ou = m.OrgUnit.objects.create(name="test", location=Point(float("nan"), float("nan"), z=0))

        # DB return an empty 2D point, and not POINT Z EMPTY which is 3D
        ous = m.OrgUnit.objects.filter(id=ou.id).extra(select={"raw_location": "ST_AsEWKT(location)"})
        self.assertEqual("SRID=4326;POINT EMPTY", ous.first().raw_location)

        ou.refresh_from_db()
        ou.name = "test2"
        ou.save()

    def test_jsondatastore_extra_fields(self):
        self.activate_constraints()
        orgunit = m.OrgUnit.objects.create(
            org_unit_type=self.sector,
            name="OrgUnit",
            version=self.version1,
        )

        extra_fields = {"population": 1000, "source": "snis"}
        orgunit.set_extra_fields(extra_fields)
        self.assertEqual(orgunit.extra_fields, extra_fields)

        # add more extra fields and update existing ones
        orgunit.set_extra_fields({"population": 2500, "foo": "bar"})
        orgunit.refresh_from_db()
        self.assertEqual(
            orgunit.extra_fields,
            {"population": 2500, "source": "snis", "foo": "bar"},
        )

    def test_same_code_same_version_valid_status(self):
        # Checks that the same code cannot be used multiple times in the same source version with the "valid" status
        code = "chuck norris is stronger than database constraints"
        m.OrgUnit.objects.create(
            name="OrgUnit 1",
            org_unit_type=self.sector,
            version=self.version1,
            code=code,
            validation_status=m.OrgUnit.VALIDATION_VALID,
        )

        with self.assertRaisesMessage(IntegrityError, "unique_code_per_source_version_if_not_blank_and_valid_status"):
            m.OrgUnit.objects.create(
                name="OrgUnit 2",
                org_unit_type=self.sector,
                version=self.version1,
                code=code,
                validation_status=m.OrgUnit.VALIDATION_VALID,
            )

    def test_same_code_same_version_various_statuses(self):
        code = "chuck norris is stronger than database constraints"
        org_unit_valid = m.OrgUnit.objects.create(
            name="OrgUnit 1",
            org_unit_type=self.sector,
            version=self.version1,
            code=code,
            validation_status=m.OrgUnit.VALIDATION_VALID,
        )
        org_unit_new_1 = m.OrgUnit.objects.create(
            name="OrgUnit 2",
            org_unit_type=self.sector,
            version=self.version1,
            code=code,
            validation_status=m.OrgUnit.VALIDATION_NEW,
        )
        org_unit_new_2 = m.OrgUnit.objects.create(
            name="OrgUnit 3",
            org_unit_type=self.sector,
            version=self.version1,
            code=code,
            validation_status=m.OrgUnit.VALIDATION_NEW,
        )
        org_unit_rejected_1 = m.OrgUnit.objects.create(
            name="OrgUnit 4",
            org_unit_type=self.sector,
            version=self.version1,
            code=code,
            validation_status=m.OrgUnit.VALIDATION_REJECTED,
        )
        org_unit_rejected_2 = m.OrgUnit.objects.create(
            name="OrgUnit 5",
            org_unit_type=self.sector,
            version=self.version1,
            code=code,
            validation_status=m.OrgUnit.VALIDATION_REJECTED,
        )

        # No IntegrityError should be raised -> 5 org units are created
        total_count = m.OrgUnit.objects.count()
        self.assertEqual(total_count, 5)
        self.assertEqual(org_unit_valid.code, org_unit_new_1.code)
        self.assertEqual(org_unit_valid.code, org_unit_new_2.code)
        self.assertEqual(org_unit_valid.code, org_unit_rejected_1.code)
        self.assertEqual(org_unit_valid.code, org_unit_rejected_2.code)

    def test_blank_codes_same_version_valid_status(self):
        # Checks that blank codes can be used multiple times in the same source version with the "valid" status
        code = ""
        org_unit_1 = m.OrgUnit.objects.create(
            name="OrgUnit 1",
            org_unit_type=self.sector,
            version=self.version1,
            code=code,
            validation_status=m.OrgUnit.VALIDATION_VALID,
        )
        org_unit_2 = m.OrgUnit.objects.create(
            name="OrgUnit 2",
            org_unit_type=self.sector,
            version=self.version1,
            code=code,
            validation_status=m.OrgUnit.VALIDATION_VALID,
        )

        # No IntegrityError should be raised -> 2 org units are created
        total_count = m.OrgUnit.objects.count()
        self.assertEqual(total_count, 2)
        self.assertEqual(org_unit_1.code, org_unit_2.code)

    def test_blank_codes_same_version_various_statuses(self):
        code = ""
        org_unit_valid = m.OrgUnit.objects.create(
            name="OrgUnit 1",
            org_unit_type=self.sector,
            version=self.version1,
            code=code,
            validation_status=m.OrgUnit.VALIDATION_VALID,
        )
        org_unit_new_1 = m.OrgUnit.objects.create(
            name="OrgUnit 2",
            org_unit_type=self.sector,
            version=self.version1,
            code=code,
            validation_status=m.OrgUnit.VALIDATION_NEW,
        )
        org_unit_new_2 = m.OrgUnit.objects.create(
            name="OrgUnit 3",
            org_unit_type=self.sector,
            version=self.version1,
            code=code,
            validation_status=m.OrgUnit.VALIDATION_NEW,
        )
        org_unit_rejected_1 = m.OrgUnit.objects.create(
            name="OrgUnit 4",
            org_unit_type=self.sector,
            version=self.version1,
            code=code,
            validation_status=m.OrgUnit.VALIDATION_REJECTED,
        )
        org_unit_rejected_2 = m.OrgUnit.objects.create(
            name="OrgUnit 5",
            org_unit_type=self.sector,
            version=self.version1,
            code=code,
            validation_status=m.OrgUnit.VALIDATION_REJECTED,
        )

        # No IntegrityError should be raised -> 5 org units are created
        total_count = m.OrgUnit.objects.count()
        self.assertEqual(total_count, 5)
        self.assertEqual(org_unit_valid.code, org_unit_new_1.code)
        self.assertEqual(org_unit_valid.code, org_unit_new_2.code)
        self.assertEqual(org_unit_valid.code, org_unit_rejected_1.code)
        self.assertEqual(org_unit_valid.code, org_unit_rejected_2.code)

    def test_switch_new_orgunit_to_valid_raises_error_with_same_code(self):
        code = "chuck norris is stronger than database constraints"
        org_unit_valid = m.OrgUnit.objects.create(
            name="OrgUnit valid",
            org_unit_type=self.sector,
            version=self.version1,
            code=code,
            validation_status=m.OrgUnit.VALIDATION_VALID,
        )
        org_unit_new = m.OrgUnit.objects.create(
            name="OrgUnit new",
            org_unit_type=self.sector,
            version=self.version1,
            code=code,
            validation_status=m.OrgUnit.VALIDATION_NEW,
        )

        # No IntegrityError should be raised -> 2 org units are created
        total_count = m.OrgUnit.objects.count()
        self.assertEqual(total_count, 2)

        with self.assertRaisesMessage(IntegrityError, "unique_code_per_source_version_if_not_blank_and_valid_status"):
            # Switching to valid was not allowed since this code was already taken
            org_unit_new.validation_status = m.OrgUnit.VALIDATION_VALID
            org_unit_new.save()

        org_unit_new.refresh_from_db()
        self.assertEqual(org_unit_valid.code, org_unit_new.code)
        self.assertEqual(org_unit_new.validation_status, m.OrgUnit.VALIDATION_NEW)  # did not change
