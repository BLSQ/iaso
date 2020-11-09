***********************
Introduction & Settings
***********************

Introduction
============
Iaso is a georegistry and data collection web platform structured around trees of organization units (also known a master lists)

The main tasks it allows to do are:

- Data collection using [XLSForm](https://xlsform.org/) forms linked to org units through a mobile application.
- Import, comparison and merging of multiple org. units trees, both through a web application and an API allowing manipulation through data science tools like [Jupyter notebooks](https://jupyter.org/).
- Validation of received data for org. units trees and forms.
- Exports of the org. unit trees and form data, either in csv, xlsx, [GeoPackage](https://www.geopackage.org/) or through an api.


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

    docker-compose run iaso manage migrate

4. Start the server
-------------------

Run in project directory:

.. code:: bash

    docker-compose up


This will build and download the containers and start them. The ``docker-compose.yml``
file describes the setup of the containers.

The web server should be reachable at ``http://localhost:8081``.


Create a user
-------------

To login to the app or the django admin, a superuser needs to be created with:

.. code:: bash

    docker-compose run iaso manage createsuperuser


Then additional users with custom groups and permissions can be added through
the django admin at ``/admin`` or loaded via fixtures.


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
| Run tests                           | ``docker-compose run iaso test``                          |
+-------------------------------------+----------------------------------------------------------+
| Create a shell inside the container | ``docker-compose run iaso bash``                          |
+-------------------------------------+----------------------------------------------------------+
| Run a shell command                 | ``docker-compose run iaso eval curl http://google.com `` |
+-------------------------------------+----------------------------------------------------------+
| Run django manage.py                | ``docker-compose run iaso manage help``                   |
+-------------------------------------+----------------------------------------------------------+
| Create a python shell               | ``docker-compose run iaso manage shell``                  |
+-------------------------------------+----------------------------------------------------------+
| Create a postgresql shell           | ``docker-compose run iaso manage dbshell``                |
+-------------------------------------+----------------------------------------------------------+
| Create pending ORM migration files  | ``docker-compose run iaso manage makemigrations``         |
+-------------------------------------+----------------------------------------------------------+
| Apply pending ORM migrations        | ``docker-compose run iaso manage migrate``                |
+-------------------------------------+----------------------------------------------------------+
| Show ORM migrations                 | ``docker-compose run iaso manage showmigrations``         |
+-------------------------------------+----------------------------------------------------------+

To seed data coming from play.dhis2.org, since the previous commands doesn't run
in the same container, you need to do a run a docker exec command

.. code:: bash
docker exec iaso_iaso_1  ./manage.py seed_test_data --mode=seed --dhis2version=2.32.6

you can then login through http://127.0.0.1:8081/dashboard with :

 - user : testemail2.31.8
 - password: testemail2.31.8

Running Django 3 on Elastic Beanstalk
=====================================

Django 3 requires version 2+ of the gdal library. Sadly, Beanstalk is based on Amazon Linux that can only install
gdal 1 from the epel repository. To be able to use gdal 2, first identify the AMI of the Elastic Beanstalk EC2 server.
In EC2, launch a new instance based on that AMI. In the instance, run
(based on https://stackoverflow.com/questions/49637407/deploying-a-geodjango-application-on-aws-elastic-beanstalk
and adapted to use /usr instead of /usr/local): (For Amazon Linux 2, use geos-3.5.2)

    wget http://download.osgeo.org/geos/geos-3.4.2.tar.bz2
    tar xjf geos-3.4.2.tar.bz2
    cd geos-3.4.2
    ./configure --prefix=/usr
    make
    sudo make install
    cd ..

    wget http://download.osgeo.org/proj/proj-4.9.1.tar.gz
    wget http://download.osgeo.org/proj/proj-datumgrid-1.5.tar.gz
    tar xzf proj-4.9.1.tar.gz
    cd proj-4.9.1/nad
    tar xzf ../../proj-datumgrid-1.5.tar.gz
    cd ..
    ./configure --prefix=/usr
    make
    sudo make install
    cd ..

    sudo yum-config-manager --enable epel
    sudo yum -y update

    sudo yum install make automake gcc gcc-c++ libcurl-devel proj-devel geos-devel autoconf automake gdal
    cd /tmp

    curl -L http://download.osgeo.org/gdal/2.2.3/gdal-2.2.3.tar.gz | tar zxf -
    cd gdal-2.2.3/
    ./configure --prefix=/usr --without-python

    make -j4
    sudo make install

    sudo ldconfig

Then go to Actions -> Image -> Create Image
When it's ready, go to the Beanstalk Instance Settings and specify the AMI reference of the image we just created.


Containers and services
=======================

The list of the main containers:

+-----------+-------------------------------------------------------------------------+
| Container | Description                                                             |
+===========+=========================================================================+
| iaso       | `Django <https://www.djangoproject.com/>`__                             |
+-----------+-------------------------------------------------------------------------+
| db        | `PostgreSQL <https://www.postgresql.org/>`__ database                   |
+-----------+-------------------------------------------------------------------------+


All of the container definitions for development can be found in the ``docker-compose.yml``.

.. note:: Postgresql uses Django ORM models for table configuration and migrations.


Tests and linting
=================

Tests can be executed with

.. code:: bash

    docker-compose run iaso test

Fixtures
--------

User fixtures can be loaded when testing. This is the list (<name>:<password>) of users:

- ``admin:adminadmin``
- ``supervisor:supervisorsupervisor``
- ``importer:importerimporter``
- ``full-exporter:exporterexporter``
- ``anon-exporter:exporterexporter``

To export some data from the database to create fixtures run e.g.:

.. code:: bash

    docker-compose run iaso manage dumpdata auth.User --indent 2

To load some fixture into the database manually run e.g.:

.. code:: bash

    docker-compose run iaso manage loaddata users


Code reloading
==============

In development the django dev server will restart when it detects a file change, either in Python or Javascript.

.. code:: shell

    docker-compose stop && docker-compose start

If you encounter problems, you can try to rebuild everything from scratch.

.. code:: shell

    # kill containers
    docker-compose kill
    # remove `iaso` container
    docker-compose rm -f iaso
    # build containers
    docker-compose build
    # start-up containers
    docker-compose up

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

Jupyter Notebook
=================

To run a Jupyter Notebook, just activate the virtualenv and run


.. code:: bash

    python manage.py shell_plus --notebook

..

Testing S3 uploads in development
=================================

If you need to test s3 storage in development, you have to:

1. Set the `AWS_STORAGE_BUCKET_NAME` env variable to a bucket created for such tests
2. Set the `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` env variables appropriately
3. Change the `DEFAULT_FILE_STORAGE` setting to `storages.backends.s3boto3.S3Boto3Storage`

Enketo
======

To enable the Enketo editor in your local environment, you will have to install our fork of enketo-express:

.. code:: shell

    git clone git@bitbucket.org:bluesquare_org/enketo-express.git
    cd setup/docker
    docker-compose up

Then, you need to make sure your `.env` file is properly configured.
`ENKETO_URL` should be set to `http://192.168.1.15:81` (Replace 192.168.1.15 by your host)

.. code:: shell

    docker-compose up
    docker exec iaso_iaso_1  ./manage.py seed_test_data --mode=seed --dhis2version=2.32.6
