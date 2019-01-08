from django.urls import reverse
from rest_framework.test import APITestCase
from django.test import override_settings
from oauth2client.crypt import AppIdentityError
from oauth2client.client import VerifyJwtTokenError
# This was really helpful about mocking:
# http://fgimian.github.io/blog/2014/04/10/using-the-python-mock-library-to-fake-regular-functions-during-tests/
import mock

from ..models import MobileUser, DeviceDB
from . import clean_couch


# Mocks for different scenarios
# of what could play out in the verify_token_id function
def valid_token(token, client_id):
    assert token, 'need a token passed'
    assert client_id, 'need a client id passed'

    return {
        'hd': 'ehealthnigeria.org',
        'family_name': 'Device11',
        'azp': client_id,
        'email': 'test_karl@ehealthnigeria.org',
        'iss': 'https://accounts.google.com',
        'locale': 'en',
        'sub': '100377948646174944684',
        'iat': 1475594698,
        'email_verified': True,
        'name': 'HAT Device11',
        'aud': client_id,
        'picture': 'picture.png',
        'given_name': 'HAT',
        'exp': 1475598298,
    }


def just_return(token, client_id):
    return {'email': 'test_karl@ehealthnigeria.org'}


def identity_error(token, client_id):
    if token == 'invalid':
        raise AppIdentityError('Token Not Valid')

    return {'email': 'test_karl@ehealthnigeria.org'}


def wrong_email(token, client_id):
    return {'email': 'test_unknown@ehealthnigeria.org'}


def no_email(token, client_id):
    return {'email': ''}


def http_error(token, client_id):
    raise VerifyJwtTokenError('Could not get google certs for verification')


@override_settings(GOOGLE_CLIENT_ID='test-client-id')
class SyncViewsTests(APITestCase):
    fixtures = ['mobile_users.json']

    def tearDown(self):
        super().tearDown()
        clean_couch()

    def test_register_url(self):
        url = reverse('signin')
        self.assertTrue(url, msg='The sync url is defined')

    def test_setup_fixtures(self):
        self.assertEqual(MobileUser.objects.count(), 2, msg='fixtures have been added')
        self.assertTrue(
            MobileUser.objects.get(email='test_karl@ehealthnigeria.org'),
            msg='finds my testuser')

    @mock.patch('oauth2client.client.verify_id_token', side_effect=valid_token)
    def test_get_credentials(self, verify_token_function):
        '''happy path test, the user is in the MobileUsers pool '''
        url = reverse('signin')
        response = self.client.post(url, {'idToken': 'Long JWT Token', 'deviceId': 'test_xxx'},
                                    format='json')
        self.assertEqual(response.status_code, 201)
        creds = response.data

        self.assertEqual(creds['username'], 'test_karl@ehealthnigeria.org')
        self.assertTrue(creds['password'], msg='provides a password')
        self.assertTrue(creds['url'], msg='provides a url to the couchdb')

        # Check that a device db now exists. This would raise otherwise
        device_db = DeviceDB.objects.get(device_id='test_xxx')
        self.assertIsNotNone(device_db, 'The device db should exist')

    @mock.patch('oauth2client.client.verify_id_token', side_effect=valid_token)
    def test_update_credentials(self, verify_token_function):
        '''happy path test, the user is in the MobileUsers pool '''
        url = reverse('signin')
        response = self.client.post(url, {'idToken': 'Long JWT Token', 'deviceId': 'test_xxx'},
                                    format='json')
        self.assertEqual(response.status_code, 201)
        creds = response.data

        response2 = self.client.post(url, {'idToken': 'Long JWT Token', 'deviceId': 'test_xxx'},
                                     format='json')
        self.assertEqual(response2.status_code, 201)
        creds2 = response2.data

        self.assertEqual(creds['username'], creds2['username'])
        self.assertEqual(creds['url'], creds2['url'])
        self.assertTrue(creds2['password'], msg='provides a new password')
        self.assertNotEqual(creds['password'], creds2['password'], msg='creates a new password')

    @mock.patch('oauth2client.client.verify_id_token', side_effect=just_return)
    def test_no_token(self, valid_token_function):
        '''what happens if no token is posted?'''
        url = reverse('signin')
        response = self.client.post(url, {'idToken': '', 'deviceId': 'test_xxx'},
                                    format='json')
        self.assertEqual(response.status_code, 400, 'returns error when no token is passed')

    @mock.patch('oauth2client.client.verify_id_token', side_effect=valid_token)
    def test_no_device_id(self, valid_token_function):
        '''what happens if no device id is posted?'''
        url = reverse('signin')
        response = self.client.post(url, {'idToken': 'Long JWT Token', 'deviceId': ''},
                                    format='json')
        self.assertEqual(response.status_code, 400, 'returns error when no device_id is passed')

    @mock.patch('oauth2client.client.verify_id_token', side_effect=identity_error)
    def test_invalid_token(self, valid_token_function):
        '''what happens if token can not be verified?'''
        url = reverse('signin')
        response = self.client.post(url, {'idToken': 'invalid', 'deviceId': 'test_xxx'},
                                    format='json')
        self.assertEqual(response.status_code, 401, 'returns error when no token is passed')

    @mock.patch('oauth2client.client.verify_id_token', side_effect=wrong_email)
    def test_valid_token_no_access(self, valid_token_function):
        '''a token with an email not in the MobileUsers list'''
        url = reverse('signin')
        response = self.client.post(url, {'idToken': 'Long JWT Token', 'deviceId': 'test_xxx'},
                                    format='json')
        self.assertEqual(
            response.status_code, 403,
            'returns forbidden when email is not recognized')

    @mock.patch('oauth2client.client.verify_id_token', side_effect=no_email)
    def test_weird_token_no_email(self, valid_token_function):
        '''somehow, the token has no email address'''
        url = reverse('signin')
        response = self.client.post(url, {'idToken': 'Long JWT Token', 'deviceId': 'test_xxx'},
                                    format='json')
        self.assertEqual(response.status_code, 500, 'returns server error on no email')

    @override_settings(GOOGLE_CLIENT_ID='')
    @mock.patch('oauth2client.client.verify_id_token', side_effect=just_return)
    def test_no_client_id(self, valid_token_function):
        '''forgot to set GOOGLE_CLIENT_ID, this would open up for any google JW Token'''
        url = reverse('signin')
        response = self.client.post(url, {'idToken': 'Long JWT Token', 'deviceId': 'test_xxx'},
                                    format='json')
        self.assertEqual(response.status_code, 500, 'returns server error on no email')

    @mock.patch('oauth2client.client.verify_id_token', side_effect=http_error)
    def test_no_google_certs(self, valid_token_function):
        url = reverse('signin')
        response = self.client.post(url, {'idToken': 'Long JWT Token', 'deviceId': 'test_xxx'},
                                    format='json')
        self.assertEqual(response.status_code, 500, 'returns server error')
