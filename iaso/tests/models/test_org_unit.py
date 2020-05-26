from iaso.test import TestCase
from django.test import tag
from iaso import models as m
from django.db import transaction


class OrgUnitModelTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.sector = m.OrgUnitType.objects.create(name="Sector", short_name="Sec")
        cls.system = m.OrgUnitType.objects.create(name="System", short_name="Sys")
        cls.jedi_council = m.OrgUnitType.objects.create(
            name="Jedi Council", short_name="Cnc"
        )
        cls.jedi_task_force = m.OrgUnitType.objects.create(
            name="Jedi Task Force", short_name="Jtf"
        )

    @tag("iaso_only")
    def test_org_unit_creation_no_parent_or_parent_has_path(self):
        """Newly created org unit without parents should have a path, and so do new org units
        attached to a parent that has a path."""

        corrusca = m.OrgUnit.objects.create(
            org_unit_type=self.sector, name="Corrusca Sector"
        )
        corruscant = m.OrgUnit.objects.create(
            parent=corrusca, org_unit_type=self.sector, name="Corruscant System"
        )
        self.assertEqual(str(corrusca.path), str(corrusca.pk))
        self.assertEqual(str(corruscant.path), f"{corrusca.pk}.{corruscant.pk}")

    @tag("iaso_only")
    def test_org_unit_creation_or_update_parent_without_path(self):
        """Created or updated a org unit linked to a pathless parent should not have a path."""

        corrusca = m.OrgUnit.objects.create(
            org_unit_type=self.sector, name="Corrusca Sector"
        )
        # trick to simulate parent without path
        m.OrgUnit.objects.filter(name="Corrusca Sector").update(path=None)
        corrusca.refresh_from_db()
        corruscant = m.OrgUnit.objects.create(
            parent=corrusca, org_unit_type=self.sector, name="Corruscant System"
        )
        self.assertIsNone(corruscant.path)
        corruscant.save()
        self.assertIsNone(corruscant.path)

    @tag("iaso_only")
    def test_org_unit_save_force_recalculate_with_children(self):
        """Saving org unit with force_calculate_path -> path should be set for the whole hierarchy"""

        corrusca = m.OrgUnit.objects.create(
            org_unit_type=self.sector, name="Corrusca Sector"
        )
        corruscant = m.OrgUnit.objects.create(
            org_unit_type=self.system, parent=corrusca, name="Coruscant System",
        )
        jedi_council_corruscant = m.OrgUnit.objects.create(
            org_unit_type=self.jedi_council,
            parent=corruscant,
            name="Corruscant Jedi Council",
        )
        m.OrgUnit.objects.all().update(path=None)
        corrusca.refresh_from_db()
        corruscant.refresh_from_db()
        jedi_council_corruscant.refresh_from_db()

        self.assertIsNone(corrusca.path)
        self.assertIsNone(corruscant.path)
        self.assertIsNone(jedi_council_corruscant.path)

        with transaction.atomic():
            # 2 update queries (normal + path update), 1 children query, 1 parent query
            # (except for the top-level org unit - no parent query for this one)
            with self.assertNumQueries(3 * 4 - 1):
                corrusca.save(force_calculate_path=True)

        corruscant.refresh_from_db()
        jedi_council_corruscant.refresh_from_db()

        self.assertEqual(str(corrusca.path), str(corrusca.pk))
        self.assertEqual(str(corruscant.path), f"{corrusca.pk}.{corruscant.pk}")
        self.assertEqual(
            str(jedi_council_corruscant.path),
            f"{corrusca.pk}.{corruscant.pk}.{jedi_council_corruscant.pk}",
        )

    @tag("iaso_only")
    def test_org_unit_hierarchy_children_descendants(self):
        """Test manager methods: hierarchy(), children() and descendants()."""

        (
            corrusca,
            corruscant,
            first_council,
            second_council,
            task_force,
        ) = self.create_simple_hierarchy()

        self.assertEqual(5, m.OrgUnit.objects.hierarchy(corrusca).count())
        self.assertEqual(1, m.OrgUnit.objects.children(corrusca).count())
        self.assertEqual(4, m.OrgUnit.objects.descendants(corrusca).count())

        self.assertEqual(4, m.OrgUnit.objects.hierarchy(corruscant).count())
        self.assertEqual(2, m.OrgUnit.objects.children(corruscant).count())
        self.assertEqual(3, m.OrgUnit.objects.descendants(corruscant).count())

        self.assertEqual(2, m.OrgUnit.objects.hierarchy(first_council).count())
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

    def create_simple_hierarchy(self):
        corrusca = m.OrgUnit.objects.create(
            org_unit_type=self.sector, name="Corrusca Sector"
        )
        corruscant = m.OrgUnit.objects.create(
            org_unit_type=self.system, parent=corrusca, name="Coruscant System",
        )
        first_council = m.OrgUnit.objects.create(
            org_unit_type=self.jedi_council,
            parent=corruscant,
            name="First Corruscant Jedi Council",
        )
        second_council = m.OrgUnit.objects.create(
            org_unit_type=self.jedi_council,
            parent=corruscant,
            name="Second Corruscant Jedi Council",
        )
        task_force = m.OrgUnit.objects.create(
            org_unit_type=self.jedi_task_force,
            parent=first_council,
            name="Jedi Ethics Task Force",
        )
        corrusca.refresh_from_db()
        corruscant.refresh_from_db()
        first_council.refresh_from_db()
        second_council.refresh_from_db()
        task_force.refresh_from_db()

        return corrusca, corruscant, first_council, second_council, task_force
