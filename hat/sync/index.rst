*****************
Sync devices data
*****************

Introduction
============

- Sync is based on CouchDB replication.
- The mobile applications gets a JSON web token from Google to prove its identity,
  and that is exchanged with couchdb credentials on the server.
- After retreiving credentials, the sync is a straight push replication. Because
  this replication is push only, it's relatively effecient with 4 requests per
  batch (currently 100 docs/batch).
- Then we're going to import the documents into the dashboard application.


Credentials exchange
====================

Every mobile device has a google account. In the mobile app retrieve
`a signed token for google plus <https://github.com/EddyVerbruggen/cordova-plugin-googleplus>`__
that we send to our server. The server then
`verifies the identity with google <https://developers.google.com/identity/sign-in/android/backend-auth>`__
and checks that the identity is in a list of users allowed to sync
(:class:`hat.sync.models.MobileUser`).

If a user is valid, the django app creates a set of couchdb credentials,
and a separate database for that device to sync with, and returns those to the client.

The endpoint for the credentials exchange is ``https://<docker-host>:8443/sync/signin``.


Data transfer/replication
=========================

The data transfer itself is a CouchDB replication. This has a few upsides and
downsides. The most important upside is that we can automatically pick up where
the replication ended the last time. The most important downside is that
replications can be chatty on the network. This is more significant for pull
replications, where the mobile app retreives data from the server. We currently
don't do this, but if we should start doing that, we must look into deploying
couchdb 2.0, a new ``_bulk_get`` endpoint specifically for this.


Import of synced docs
=====================

There is a cron task :func:`hat.tasks.jobs.import_synced_devices_task` executed
every hour that checks for every registered device (:class:`hat.sync.models.DeviceDB`)
the associated ``_changes`` endpoint in its CouchDB database.
If the ``last_seq`` value differs from the last time value the job imports
the new CouchDB records into the Dashboard database.


Technical notes
===============

Credentials exchange endpoint
-----------------------------

.. automodule:: hat.sync.views
   :members:

CouchDb helpers
---------------

.. automodule:: hat.sync.couchdb_helpers
   :members:
