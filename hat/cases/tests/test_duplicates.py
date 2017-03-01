from django.db import connection
from django.db.models import Q
from django.db.utils import IntegrityError
from django.test import TestCase

from hat.cases.models import Case, DuplicatesPair, IgnoredPair
from hat.queries import duplicates_queries
from hat.cases.duplicates import commit_merge, commit_ignore


class DuplicatesTests(TestCase):
    fixtures = ['duplicates']

    '''
    PLAYING WITH:
      {
        "model": "cases.case",
        "pk": 1,
        "fields": {
          "document_id": "1",
          "document_date": "2016-01-01T00:00:00Z",  <== OLDER
          "ZS": "Mosango",
          "AS": "Muluma",
          "village": "Kisala-lupa",
          "name": "John",
          "prename": "XX",
          "lastname": "Smith",                      <== DIFFERENT
          "mothers_surname": "Doe",
          "sex": "male",
          "age": 10                                 <== MISSING
        }
      },
      {
        "model": "cases.case",
        "pk": 2,
        "fields": {
          "document_id": "2",
          "document_date": "2016-01-02T00:00:00Z",  <== YOUNGER
          "ZS": "Mosango",
          "AS": "Muluma",
          "name": "John",
          "prename": "XX",
          "lastname": "Smit",                       <== DIFFERENT
          "mothers_surname": "Doe",
          "sex": "male",
          "test_maect": false,                      <== NEW
          "test_rdt": true                          <== NEW
        }
      },
      {
        "model": "cases.case",
        "pk": 3,
         ...
      },
      {
        "model": "cases.case",
        "pk": 4,
         ...
      }
    '''

    def setUp(self):
        # check that the correct fixtures were loaded
        self.assertEqual(Case.objects.all().count(), 4)

        # generate duplicates
        with connection.cursor() as cursor:
            cursor.execute(duplicates_queries.makepairs())
        self.assertEqual(DuplicatesPair.objects.all().count(), 1)

    def test_duplicatespair_model(self):
        # take first duplicate pair
        pair = DuplicatesPair.objects.first()

        # repeat same entry
        self.assertRaises(IntegrityError, DuplicatesPair(
            case1_id=pair.case1_id,
            document_id1=pair.document_id1,
            case2_id=pair.case2_id,
            document_id2=pair.document_id2).save)

        # break ids order constraint
        self.assertRaises(Exception, DuplicatesPair(
            case1_id=pair.case2_id,
            document_id1=pair.document_id2,
            case2_id=pair.case1_id,
            document_id2=pair.document_id1).save)

    def test_duplicatespair_ignore(self):
        # take first duplicate pair
        duplicatePair = DuplicatesPair.objects.first()

        self.assertEqual(IgnoredPair.objects.all().count(), 0)

        # ignore pair
        commit_ignore(duplicatePair.id)

        # check duplicates/ignored pairs lists
        self.assertFalse(DuplicatesPair.objects.filter(pk=duplicatePair.id).exists())
        self.assertEqual(IgnoredPair.objects.all().count(), 1)

        ignoredPair = IgnoredPair.objects.first()
        self.assertEqual(ignoredPair.document_id1, duplicatePair.document_id1)
        self.assertEqual(ignoredPair.document_id2, duplicatePair.document_id2)

        # re-generate duplicates
        with connection.cursor() as cursor:
            cursor.execute(duplicates_queries.makepairs())
        # it should have been ignored
        self.assertEqual(DuplicatesPair.objects.all().count(), 0)

    def test_duplicatespair_merge_cases(self):
        # take first duplicate pair
        duplicatePair = DuplicatesPair.objects.first()
        # get cases in chronological asc order
        [
            older_case,
            younger_case
        ] = Case.objects.filter(id__in=[duplicatePair.case1_id, duplicatePair.case2_id]) \
                        .order_by('document_date')

        # merge pair
        commit_merge(duplicatePair.id)

        # check duplicates pairs list
        self.assertEqual(DuplicatesPair.objects.all().count(), 0)

        # check cases: older_case remains, younger_case was deleted
        self.assertTrue(Case.objects.filter(pk=older_case.id).exists())
        self.assertFalse(Case.objects.filter(pk=younger_case.id).exists())

        # check merged case properties
        merged_case = Case.objects.get(pk=older_case.id)

        # document_id didn't changed
        self.assertEqual(merged_case.document_id, older_case.document_id)

        # merged case took younger case properties if they exist in both cases
        self.assertNotEqual(merged_case.lastname, older_case.lastname)
        self.assertEqual(merged_case.lastname, younger_case.lastname)

        # merged case kept older case properties if they are not in the younger case
        self.assertIsNone(younger_case.age)
        self.assertIsNotNone(older_case.age)
        self.assertEqual(merged_case.age, older_case.age)

        # merged case took younger case new properties
        self.assertIsNone(older_case.test_maect)
        self.assertIsNone(older_case.test_rdt)
        self.assertEqual(merged_case.test_maect, younger_case.test_maect)
        self.assertEqual(merged_case.test_rdt, younger_case.test_rdt)

        # logs properties
        self.assertEqual(older_case.version_number, 1)
        self.assertEqual(merged_case.version_number, older_case.version_number + 1)

    def test_duplicatespair_merge_pairs(self):
        # truncate duplicate pair list
        DuplicatesPair.objects.all().delete()

        # create new duplicates entries with case ids 1 or 2
        pair = DuplicatesPair(case1_id=2, document_id1='2', case2_id=1, document_id2='1')
        pair.save()
        DuplicatesPair(case1_id=3, document_id1='3', case2_id=1, document_id2='1').save()
        DuplicatesPair(case1_id=3, document_id1='3', case2_id=2, document_id2='2').save()
        DuplicatesPair(case1_id=4, document_id1='4', case2_id=1, document_id2='1').save()
        DuplicatesPair(case1_id=4, document_id1='4', case2_id=2, document_id2='2').save()

        # merge pair
        commit_merge(pair.id)

        # the merge should have replaced ALL `2` entries with `1` and remove the repeated ones
        self.assertEqual(DuplicatesPair.objects.filter(Q(case1_id=2) | Q(case2_id=2)).count(), 0)
        self.assertEqual(DuplicatesPair.objects.filter(Q(case1_id=1) | Q(case2_id=1)).count(), 2)
