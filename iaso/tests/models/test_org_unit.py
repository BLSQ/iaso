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
    def test_org_unit_creation(self):
        """For now, by default, newly created org unit should not have a path."""

        corrusca = m.OrgUnit.objects.create(
            org_unit_type=self.sector, name="Corrusca Sector"
        )
        self.assertIsNone(corrusca.path)

    @tag("iaso_only")
    def test_org_unit_save_default(self):
        """For now, by default, newly created org unit should not have a path. Calling save() for an org
        unit without a path should not result in a path being set."""

        corrusca = m.OrgUnit.objects.create(
            org_unit_type=self.sector, name="Corrusca Sector"
        )
        self.assertIsNone(corrusca.path)
        corrusca.save()
        self.assertIsNone(corrusca.path)

    @tag("iaso_only")
    def test_org_unit_save_force_recalculate(self):
        """Saving org unit with force_calculate_path -> path should be set"""

        corrusca = m.OrgUnit.objects.create(
            org_unit_type=self.sector, name="Corrusca Sector"
        )
        corrusca.save(force_calculate_path=True)
        self.assertEqual(str(corrusca.path), str(corrusca.pk))

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

        self.assertIsNone(corrusca.path)
        self.assertIsNone(corruscant.path)
        self.assertIsNone(jedi_council_corruscant.path)

        with transaction.atomic():
            # 1 update query, 1 children query, 1 parent query (except for the top-level org unit)
            with self.assertNumQueries(3 * 3 - 1):
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
    def test_org_unit_children_descendants(self):
        """For now, newly created org unit should not have a path."""

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
        corrusca.save(force_calculate_path=True)
        corruscant.refresh_from_db()
        first_council.refresh_from_db()
        second_council.refresh_from_db()
        task_force.refresh_from_db()

        self.assertEqual(1, m.OrgUnit.objects.children(corrusca.path).count())
        self.assertEqual(4, m.OrgUnit.objects.descendants(corrusca.path).count())

        self.assertEqual(2, m.OrgUnit.objects.children(corruscant.path).count())
        self.assertEqual(3, m.OrgUnit.objects.descendants(corruscant.path).count())

        self.assertEqual(1, m.OrgUnit.objects.children(first_council.path).count())
        self.assertEqual(1, m.OrgUnit.objects.descendants(first_council.path).count())

        self.assertEqual(0, m.OrgUnit.objects.children(task_force.path).count())
        self.assertEqual(0, m.OrgUnit.objects.descendants(task_force.path).count())
