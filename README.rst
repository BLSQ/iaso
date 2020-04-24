***********************
Introduction & Settings
***********************

Introduction
============

Trypelim Dashboard is an online tool to see and manage data related to
Human African Trypanosomiasis and the activities undertaken by different
organisations to eradicate it.

The dashboard presents data from historical data sets and the mobile application.


.. note:: The dashboard is optimized for Chrome and must be compatible with
          Chrome 40.0.0 and further versions.


Development environment
=======================

No local setup should be needed apart from:

- `docker <https://docs.docker.com/engine/installation/>`__
- `docker-compose <https://docs.docker.com/compose/>`__

The local dev setup uses **docker-compose** to spin up all necessary services.
Make sure you have it installed and can connect to the **docker daemon**.

1. Environment variables
------------------------

The `docker-compose.yml` file contains sensible defaults for the django application.

Other environment variables can be provided by a `.env file <https://docs.docker.com/v17.12/compose/environment-variables/#the-env-file>`_.

As a starting point, you can copy the sample `.env.dist` file and edit it to your needs.

.. code:: bash

    cp .env.dist .env


2. Build the containers
-----------------------

Run in project directory:

.. code:: bash

    docker-compose build

3. Run migrations
-----------------

.. code:: bash

    docker-compose run hat manage migrate

4. Start the server
-------------------

Run in project directory:

.. code:: bash

    docker-compose up


This will build and download the containers and start them. The ``docker-compose.yml``
file describes the setup of the containers.

The web server should be reachable at ``https://<docker-host>:8443``.

Because the https connection uses a self signed cert in development, that needs
to be accepted manually. If you see no styles in the browser, have a look in the
js-console if the requests to webpack fail. If they fail, try to open the webpack
url once and accept the self signed cert there as well.

It will load some users via fixtures. See the `user name/password <#fixtures>`__
combos further down.

`Jupyter <http://jupyter.org/>`__ iPython notebook server is run at port ``8888``
as well, that can be used for exploration in development.

We use `Sphinx <http://www.sphinx-doc.org/en/stable/>`__ to generate app
documentation. This documentation should be reachable at
``https://<docker-host>:8443/static/docs/index.html``.

.. code:: bash

    docker-compose run hat gen_docs


Create a user
-------------

To login to the app or the django admin, a superuser needs to be created with:

.. code:: bash

    docker-compose run hat manage createsuperuser


Then additional users with custom groups and permissions can be added through
the django admin at ``https://<docker-host>:8443/admin`` or loaded via fixtures.


Import mobile backups
=====================

For the app to be able to decrypt mobile backups, it needs a private key.
The key must be exported as env var ``$HAT_MOBILE_KEY`` and will be picked up by
docker-compose. The key is also needed to run the tests.

The mobile app can write encrypted backups to a usb storage device.
The data is encrypted using `JSON Web Encryption <https://tools.ietf.org/html/rfc7516>`__.
It uses RSA-OAEP-256 for the asymetric part and A256GCM for the symmetric
encryption from `JSON Web Algorithms <https://tools.ietf.org/html/rfc7518>`__.

The public RSA key will be bundled with the mobile app. During a backup, the app
will generate a new AES key to encrypt the data. The AES key will then be
encrypted using the RSA public key. The encrypted data will be bundled with a
header containing the encrypted AES key, iv, the authentication Tag and some extra
info and encoded in base64. This process is done by a library which uses the
native browser webcrypto api. Eventually the encryption bundle will be written
to a file on the usb storage. The app will also write a second file containing
a date stamp and some info in cleartext.

Keys are stored in `JSON Web Key <https://tools.ietf.org/html/rfc7517>`__ format.
The public key is bundled with the app.


A backup can be decrypted using the decrypt script and the private key, e.g.:

.. code:: bash

    ./scripts/decrypt_mobilebackup.js '$HAT_MOBILE_KEY' data.backup.enc > data.json


If you'd need to ENCRYPT a file, you can use the encrypt script.

.. code:: bash

    ./scripts/encrypt_mobilebackup.js data.json > data.backup.enc


Run commands on the server
==========================

Each docker container uses the same script as entrypoint. The ``entrypoint.sh``
script offers a range of commands to start services or run commands.
The full list of commands can be seen in the script.
The pattern to run a command is always
``docker-compose run <container-name> <entrypoint-command> <...args>``

The following are some examples:

+-------------------------------------+----------------------------------------------------------+
| Action                              | Command                                                  |
+=====================================+==========================================================+
| Generate documentation              | ``docker-compose run hat gen_docs``                      |
+-------------------------------------+----------------------------------------------------------+
| Run tests                           | ``docker-compose run hat test``                          |
+-------------------------------------+----------------------------------------------------------+
| Run JS tests                        | ``docker-compose run hat test_js``                       |
+-------------------------------------+----------------------------------------------------------+
| Run JS tests without Lint           | ``docker-compose run hat mocha``                         |
+-------------------------------------+----------------------------------------------------------+
| Run integration tests               | ``docker-compose run hat test_integration``              |
+-------------------------------------+----------------------------------------------------------+
| Create a shell inside the container | ``docker-compose run hat bash``                          |
+-------------------------------------+----------------------------------------------------------+
| Run a shell command                 | ``docker-compose run hat eval curl http://couchdb:5984`` |
+-------------------------------------+----------------------------------------------------------+
| Run django manage.py                | ``docker-compose run hat manage help``                   |
+-------------------------------------+----------------------------------------------------------+
| Create a python shell               | ``docker-compose run hat manage shell``                  |
+-------------------------------------+----------------------------------------------------------+
| Create a postgresql shell           | ``docker-compose run hat manage dbshell``                |
+-------------------------------------+----------------------------------------------------------+
| Create pending ORM migration files  | ``docker-compose run hat manage makemigrations``         |
+-------------------------------------+----------------------------------------------------------+
| Apply pending ORM migrations        | ``docker-compose run hat manage migrate``                |
+-------------------------------------+----------------------------------------------------------+
| Show ORM migrations                 | ``docker-compose run hat manage showmigrations``         |
+-------------------------------------+----------------------------------------------------------+

To seed data coming from play.dhis2.org, since the previous commands doesn't run
in the same container, you need to do a run a docker exec command

`
docker exec -it sense-hat_hat_1 bash -c './manage.py seed_test_data --mode=seed --dhis2version=2.31.8'
`

you can then login through http://127.0.0.1:8081/dashboard with :

 - user : testemail2.31.8
 - password: testemail2.31.8

Containers and services
=======================

The list of the main containers:

+-----------+-------------------------------------------------------------------------+
| Container | Description                                                             |
+===========+=========================================================================+
| hat       | `Django <https://www.djangoproject.com/>`__                             |
+-----------+-------------------------------------------------------------------------+
| db        | `PostgreSQL <https://www.postgresql.org/>`__ database                   |
+-----------+-------------------------------------------------------------------------+
| couchdb   | `CouchDB <http://couchdb.apache.org/>`__ database for sync              |
+-----------+-------------------------------------------------------------------------+
| rq        | `RQ python <http://python-rq.org/>`__ task runner to perform jobs       |
+-----------+-------------------------------------------------------------------------+
| redis     | `Redis <https://redis.io/>`__ for task queueing and task result storage |
+-----------+-------------------------------------------------------------------------+

All of the container definitions for development can be found in the ``docker-compose.yml``.

.. note:: Postgresql uses Django ORM models for table configuration and migrations.
.. note:: CouchDB can be setup by a custom Django management command ``manage setupcouchdb``.


Tests and linting
=================

Tests can be executed with

.. code:: bash

    docker-compose run hat test


This also runs `flake8 <http://flake8.pycqa.org/en/latest/>`__ to check the code.

.. warning:: The tests need the ``HAT_MOBILE_KEY`` to be set.

Fixtures
--------

User fixtures can be loaded when testing. This is the list (<name>:<password>) of users:

- ``admin:adminadmin``
- ``supervisor:supervisorsupervisor``
- ``supervisor-mosango:supervisorsupervisor`` (to test restrictions by location)
- ``importer:importerimporter``
- ``full-exporter:exporterexporter``
- ``anon-exporter:exporterexporter``

To export some data from the database to create fixtures run e.g.:

.. code:: bash

    docker-compose run hat manage dumpdata auth.User --indent 2

To load some fixture into the database manually run e.g.:

.. code:: bash

    docker-compose run hat manage loaddata users


Code reloading
==============

In development the django dev server will restart when it detects a file change.
The task runner currently doesn't detect changes and will not automatically restart.

Restart the ``redis`` and ``rq`` containers to load the new code:

.. code:: bash

    docker-compose restart redis rq


Unfortunately, neither the SQL queries are refreshed so for now you need
to restart the container after adding or changing them.

Restart the ``hat`` container to load the new SQL queries:

.. code:: shell

    docker-compose restart hat


If everything fails� **be drastic!**

.. code:: shell

    docker-compose stop && docker-compose start


**EXTREMELY  DRASTIC!!!**

.. code:: shell

    # kill containers
    docker-compose kill
    # remove `hat` container
    docker-compose rm -f hat
    # build containers
    docker-compose build
    # start-up containers
    docker-compose up

.. warning:: NEVER remove **db** or **couchdb** containers without backup or
             you'll loose all the data!!!

Code formatting
===============
We have adopted Black `<https://github.com/psf/black>`__ as our code formatting tool.

The easiest way to use is is to set it up as a pre-commit hook:

1. Install pre-commit: pip install pre-commit
2. Add pre-commit to requirements.txt (or requirements-dev.txt)
3. Define .pre-commit-config.yaml with the hooks you want to include.
4. Execute pre-commit install to install git hooks in your .git/ directory.

Here is an example of pre-commit-config.yaml:

.. code:: yaml

    repos:
    -   repo: https://github.com/ambv/black
        rev: stable
        hooks:
        - id: black
          language_version: python3.6

..


React Intl
===============

if often block the deployment.

you can test the default message extraction with

.. code:: shell

# make sure you commit everything

npm run webpack-prod

git clean -n

git clean -f
..


Analysing webpack bundle size
=============================

The following commands will respectively:

1. Generate the assets bundles for production with profiling enabled
2. Run a dev server with webpack-bundle-analyzer to display bundle stats

.. code:: bash

    npm run webpack-prod-profile
    npm run webpack-analyzer

..

Jupyter Notebook
=================

To run a Jupyter Notebook, just activate the virtualenv and run


.. code:: bash

    python manage.py shell_plus --notebook

..
