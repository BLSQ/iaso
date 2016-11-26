from django.conf import settings
import hat.couchdb.api as couchdb
from hat.cases.models import Location
from . import DBTestCase
from ..import_locations import STORE_ID, import_locations_file
from ..reimport import reimport

dbf_file = 'testdata/locations_population.dbf'


class ImportLocationsTests(DBTestCase):
    def test_import_locations(self):
        stats = import_locations_file('testdata', dbf_file, True)

        self.assertTrue(stats['success'])
        self.assertEqual(stats['orgname'], 'testdata')
        self.assertEqual(stats['num_imported'], 9)
        self.assertEqual(stats['num_total'], 9)
        self.assertEqual(stats['num_with_population'], 2)
        self.assertEqual(stats['error'], None)
        self.assertEqual(stats['store_id'], STORE_ID)

        self.assertEqual(stats['num_imported'], Location.objects.count())
        self.assertEqual(stats['num_with_population'],
                         Location.objects.filter(population__isnull=False).count())

        r = couchdb.get(settings.COUCHDB_DB + '/' + STORE_ID)
        r.raise_for_status()

        # When we import again, the number of rows should be the same,
        # because existing data gets wiped before new rows are inserted.
        stats2 = import_locations_file('testdata', dbf_file, True)
        for key, value in stats.items():
            self.assertEqual(stats2[key], value)

        r = couchdb.get(settings.COUCHDB_DB + '/' + STORE_ID)
        r.raise_for_status()

    def test_reimport_locations(self):
        import_locations_file('testdata', dbf_file, True)
        count = Location.objects.count()
        self.assertEqual(count, 9)
        Location.objects.all().delete()
        reimport()
        self.assertEqual(Location.objects.count(), count)
