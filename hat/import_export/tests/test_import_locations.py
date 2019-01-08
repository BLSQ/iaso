from unittest import skip

from django.test import TestCase
from hat.cases.models import Location
from ..import_locations import import_locations_file, import_locations_areas_file

dbf_file = 'testdata/locations_population.dbf'
dbf_areas = 'testdata/locations_areas.dbf'


class ImportLocationsTests(TestCase):
    @skip("Obsolete")
    def test_import_locations(self):
        r = import_locations_file('testdata', dbf_file)

        self.assertEqual(r['orgname'], 'testdata')
        self.assertEqual(r['stats'].total, 9)
        self.assertEqual(r['stats'].created, 9)
        self.assertEqual(r['num_with_population'], 2)
        self.assertEqual(r['error'], None)

        self.assertEqual(Location.objects.count(), 9)
        self.assertEqual(r['num_with_population'],
                         Location.objects.filter(population__isnull=False).count())

        # When we import again, the number of rows should be the same,
        # because existing data get wiped before new rows are inserted.
        r2 = import_locations_file('testdata', dbf_file)
        self.assertEqual(r2['stats'].created, r['stats'].created)
        self.assertEqual(r2['stats'].deleted, 9)

    @skip("Obsolete")
    def test_import_locations_areas(self):
        # first import locations list
        import_locations_file('testdata', dbf_file)
        count = Location.objects.count()

        r = import_locations_areas_file('testdata', dbf_areas)

        self.assertEqual(r['orgname'], 'testdata')
        self.assertEqual(r['stats'].updated, 2)  # says imported but are updated
        self.assertEqual(r['stats'].total, 1)  # only one row in the file
        self.assertEqual(r['error'], None)
        self.assertEqual(Location.objects.count(), count)  # no new locations

        # When we import again, the number of updated rows should be the same.
        r2 = import_locations_areas_file('testdata', dbf_areas)
        self.assertEqual(r2['stats'].updated, r['stats'].updated)
