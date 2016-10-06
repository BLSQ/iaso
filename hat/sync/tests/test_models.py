from django.test import TransactionTestCase
from hat.sync.models import MobileUser
from django.db import IntegrityError

from . import clean_couch
from hat.sync.credentials import create_or_update
from hat.couchdb import api


class MobileUserTestCase(TransactionTestCase):
    def tearDown(self):
        super().tearDown()
        clean_couch()

    def test_create_model(self):
        '''
        Test that we create the MobileUsers with email as unique primary key,
        and that we can find them
        '''
        email = 'test_karl@ehealthnigeria.org'
        first_user = MobileUser.objects.create(email=email)

        self.assertRaises(
            IntegrityError,
            MobileUser.objects.create,
            email=email)

        found_user = MobileUser.objects.get(email=email)

        self.assertEquals(first_user, found_user, 'retreives user via email')

    def test_delete_model(self):
        '''
        Tests that the MobileUser model and the CouchDB users work together,
        that CouchDB users that have been created for a MobileUser gets deleted,
        but that the database is kept (so we don't delete data)
        '''
        email = 'test_till@ehealthnigeria.org'
        test_user = MobileUser.objects.create(email=email)
        # create couchdb credentials
        test_user_creds = create_or_update(email)

        test_user.couchdb_id = test_user_creds['_id']
        test_user.db_name = test_user_creds['db_name']
        test_user.save()

        couch_user = api.get('_users/{}'.format(test_user.couchdb_id))
        self.assertEqual(couch_user.status_code, 200, msg='couchdb user exists')

        test_user.delete()

        couch_user2 = api.get('_users/{}'.format(test_user.couchdb_id))
        self.assertEqual(couch_user2.status_code, 404, msg='couchdb user has been deleted')

    def test_delete_model_no_couch_user(self):
        '''
        Test that the model doesn't throw errors on non-existing couch user
        '''
        email = 'test_ally@ehealthnigeria.org'
        test_user = MobileUser.objects.create(email=email)

        test_user.couchdb_id = 'org.couchdb.user:{}'.format(email)
        test_user.save()

        test_user.delete()

        self.assertTrue(True, 'Non-existing couch user did not throw an error')
