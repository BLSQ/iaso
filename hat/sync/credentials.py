'''
Generate and update CouchDB credentials
(for mobile users authenticating via their google token)

This file contains tools to create and update CouchDB credentials.
Use the create_or_update function, which either creates a new set of credentials/db,
or generates a new password for an existing user (as an automatic 'forgot password' function)
'''
from hat.couchdb import setup, api
import string
import random
import re


def generate_password():
    '''
    Generate a long password string
    These passwords are never intended to be typed by hand, but rather
    used behind the scene to authenticate the mobile app

    http://stackoverflow.com/questions/2257441/random-string-generation-with-upper-case-letters-and-digits-in-python/23728630#23728630
    '''
    return ''.join(random.SystemRandom().choice(
            string.ascii_uppercase + string.digits + string.ascii_lowercase
        ) for _ in range(100))


def generate_user_id(user_name):
    return 'org.couchdb.user:{}'.format(user_name)


def generate_credentials(email):
    '''
    Generate a complete set of credentials base on an email address,
    including a new randomized password.

    filter according to
    http://docs.couchdb.org/en/master/api/database/common.html#put--db
    + remove some more special chars, since they're annoying
    '''
    filtered_email = re.sub('[^a-z0-9_-]', '', email)
    return {
        'user_name': email,
        'password': generate_password(),
        # prefix all the db:s with device_{email}
        'db_name': 'device_{}'.format(filtered_email)
    }


def create(user_name, password, db_name):
    '''
    Generates a username from the email address.
    Creates a user for that username.
    Creates a couchdb database which only that user can access.
    '''
    # couchdb stops empty username
    # should throw on invalid password,
    assert password, 'No password Provided!'
    # should throw on invalid dbname
    assert db_name, 'No db name Provided!'

    user_id = generate_user_id(user_name)

    # http://docs.couchdb.org/en/master/intro/security.html#users-documents
    user_doc = {
        'name': user_name,
        'password': password,
        'roles': [],
        'type': 'user',
        # meta fields
        'email': user_name,
        'db_name': db_name,
        'mobile_user': True
    }

    # this raises HttpError 409 if user exists
    r = api.put('_users/{}'.format(user_id), json=user_doc)
    r.raise_for_status()

    # Create a database where only the user has access
    setup.setup_db(db_name, {
        '_security': {
            'admins': {'names': [], 'roles': []},
            'members': {'names': [user_name], 'roles': []}
        }
    })


def update(url, password, existing):
    '''
    Update existing user with new password
    '''
    del existing['derived_key']
    del existing['salt']
    existing['password'] = password
    api.put(url, json=existing)


def create_or_update(email):
    '''
    For emails not having a CouchDB user, creates a DB, and a couchdb user,
    returns the credentials for that DB

    For emails with an existing user, generate a new password, update
    the user and return the new credentials set

    This is the method to call from this module!
    '''
    assert email, 'email needs to be defined'

    user_id = generate_user_id(email)
    user_url = '_users/{}'.format(user_id)

    r = api.get(user_url)
    exists = r.status_code < 400

    credentials = generate_credentials(email)

    if exists:
        update(
            user_url,
            credentials['password'],
            r.json()
        )

    else:
        create(
            credentials['user_name'],
            credentials['password'],
            credentials['db_name']
        )

    # return couchdb id to store in model
    credentials['_id'] = user_id
    return credentials
