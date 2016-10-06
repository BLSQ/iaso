from django.test import TestCase
from hat.sync import credentials
from hat.couchdb import api

from . import clean_couch


class SyncCredentialsTestCase(TestCase):
    def tearDown(self):
        super().tearDown()
        clean_couch()

    # start with the easy one:
    def test_generate_credentials(self):
        creds = credentials.generate_credentials('karl.westin@ehealthnigeria.org')

        self.assertEqual(creds['user_name'], 'karl.westin@ehealthnigeria.org')
        self.assertEqual(len(creds['password']), 100)
        self.assertEqual(creds['db_name'], 'device_karlwestinehealthnigeriaorg')

    def test_create_user_and_db(self):
        creds = credentials.generate_credentials('test_user@ehealthnigeria.org')

        credentials.create(creds['user_name'], creds['password'], creds['db_name'])

        # check that the user has access using the creds
        valid_creds_request = api.get(
            creds['db_name'],
            auth=(creds['user_name'], creds['password'])
        )

        self.assertEqual(
            valid_creds_request.status_code,
            200,
            msg='db got created and the user has access')

        # check that non-authed user does not have access
        invalid_creds_request = api.get(
            creds['db_name'],
            auth=('randomuser', 'randompassword')
        )

        self.assertEqual(
            invalid_creds_request.status_code,
            401,
            msg='invalid user does not have access')

    def test_update_user_password(self):
        creds = credentials.generate_credentials('test_user2@ehealthnigeria.org')

        credentials.create(creds['user_name'], creds['password'], creds['db_name'])
        new_password = 'super secure new password'

        user_url = '_users/org.couchdb.user:test_user2@ehealthnigeria.org'
        user_doc = api.get(user_url).json()

        credentials.update(user_url, new_password, user_doc)

        # check that the user has access using the creds
        valid_creds_request = api.get(
            creds['db_name'],
            auth=(creds['user_name'], new_password)
        )

        self.assertEqual(
            valid_creds_request.status_code,
            200,
            msg='Has access to DB using new password')

        # check that non-authed user does not have access
        invalid_creds_request = api.get(
            creds['db_name'],
            auth=(creds['user_name'], creds['password'])
        )

        self.assertEqual(
            invalid_creds_request.status_code,
            401,
            msg='No access to DB using old password')

    def test_create_or_update(self):
        test_email = 'test_user3@ehealthnigeria.org'
        creds = credentials.create_or_update(test_email)

        self.assertTrue(creds['user_name'])
        self.assertTrue(creds['db_name'])
        self.assertTrue(creds['_id'])
        self.assertTrue(creds['password'])

        valid_creds_request = api.get(
            creds['db_name'],
            auth=(creds['user_name'], creds['password'])
        )

        self.assertEqual(
            valid_creds_request.status_code,
            200,
            msg='Has access to DB using first password')

        creds2 = credentials.create_or_update(test_email)

        self.assertEqual(creds['user_name'], creds2['user_name'], msg='Username should stay')
        self.assertEqual(creds['db_name'], creds2['db_name'], msg='Database name should stay')
        self.assertEqual(creds['_id'], creds2['_id'], msg='User Doc ID should stay')
        self.assertNotEqual(creds['password'], creds2['password'], msg='Password should be new')

        valid_creds_request2 = api.get(
            creds['db_name'],
            auth=(creds2['user_name'], creds2['password'])
        )

        self.assertEqual(
            valid_creds_request2.status_code,
            200,
            msg='Has access to DB using new password')
