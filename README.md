Introduction
============

Iaso is a georegistry and data collection web platform structured around
trees of organization units (also known a master lists)

The main tasks it allows to do are:

-   Data collection using [XLSForm](https://xlsform.org/) forms linked
    to org units through a mobile application.
-   Import, comparison and merging of multiple org. units trees, both
    through a web application and an API allowing manipulation through
    data science tools like [Jupyter notebooks](https://jupyter.org/).
-   Validation of received data for org. units trees and forms.
-   Exports of the org. unit trees and form data, either in csv, xlsx,
    [GeoPackage](https://www.geopackage.org/) or through an api.

Structure
---------

Iaso is composed of a Django app and a React front end. They interact
via an API implemented via Django rest framework.

More documentation on the Front End part is in
[hat/assets/README.rst](hat/assets/README.rst)

Development environment
=======================

Setup
-----


No local setup should be needed apart from:

-   [docker](https://docs.docker.com/engine/installation/)
-   [docker-compose](https://docs.docker.com/compose/)

The local dev setup uses **docker-compose** to spin up all necessary
services. Make sure you have it installed and can connect to the
**docker daemon**.

### 1. Environment variables

The docker-compose.yml file contains sensible defaults for the Django
application.

Other environment variables can be provided by a [.env
file](https://docs.docker.com/v17.12/compose/environment-variables/#the-env-file).

As a starting point, you can copy the sample .env.dist file and edit it
to your needs.

``` {.sourceCode .bash}
cp .env.dist .env
```

### 2. Build the containers

Run in project directory:

``` {.sourceCode .bash}
docker-compose build
```

### 3. Start the database

``` {.sourceCode .bash}
docker-compose up db
```

### 4. Run migrations

``` {.sourceCode .bash}
docker-compose exec iaso ./manage.py migrate
```

### 5. Start the server

Run in project directory:

``` {.sourceCode .bash}
docker-compose up
```

This will build and download the containers and start them. The
`docker-compose.yml` file describes the setup of the containers.

The web server should be reachable at `http://localhost:8081` (you
should see a login form).


### 6. Create a superuser

To login to the app or the Django admin, a superuser needs to be created
with:

``` {.sourceCode .bash}
docker-compose exec iaso ./manage.py createsuperuser
```

You can now login in the admin at `http://localhost:8081/admin`.

Then additional users with custom groups and permissions can be added
through the Django admin or loaded via fixtures.

### 7. Create and import data

To create the initial account, project and profile, do the following:

``` {.sourceCode .bash}
docker exec iaso_iaso_1 ./manage.py create_and_import_data
```

And run the following command to populate your database with a tree of
org units (these are childcare schools in the West of DRC):

``` {.sourceCode .bash}
docker-compose exec iaso ./manage.py tree_importer --org_unit_csv_file testdata/schools.csv --source_name wb_schools_2019 --data_dict testdata/data_dict.json --version_number=1 --project_id=1 --main_org_unit_name maternelle
```

You can now login on `http://localhost:8081`

Alternatively to this step and the latter you can import data from DHIS2 see section below.

### 8. Create a form

Run the following command to create a form:

``` {.sourceCode .bash}
docker exec iaso_iaso_1 ./manage.py create_form
```

At this point, if you want to edit forms directly on your machine using
Enketo, go to the Enketo setup section of this README (down below).

Once you are done, you can click on the eye for your newly added form,
click on "+ Create", tap a letter, then enter, select the org unit, then
click "Create instance".

If Enketo is running and well setup, you can fill the form now.

### 9. Create other cool stuff

You can now start to develop additional features on Iaso!


### 10. Import data from DHIS2

Alternatively to steps 7-8, you can import data from the DHIS2 demo server (play.dhis2.org).

By running the command


``` {.sourceCode .bash}
docker-compose run iaso manage.py seed_test_data --mode=seed --dhis2version=2.35.3
```

The hierarchy of OrgUnit, group of OrgUnit, Forms, and their Submissions will be imported. Type of OrgUnit are not
handled at the moment

you can then login through <http://127.0.0.1:8081/dashboard> with :

 -   user : testemail2.35.3
 -   password: testemail2.35.3
 
Run commands inside the docker
-------------------------------

Each docker container uses the entrypoint.


The `entrypoint.sh` script offers a range of commands to start services or
run commands. The full list of commands can be seen in the script. The
pattern to run a command is
`docker-compose run <container-name> <entrypoint-command> <...args>`

The following are some examples:

* Run tests                    `docker-compose exec iaso ./manage.py test`
* Create a shell inside the container    `docker-compose run iaso bash`
* Run a shell command          `docker-compose run iaso eval curl http://google.com`
* Run Django manage.py         `docker-compose exec iaso ./manage.py help`
* Launch a python shell        `docker-compose exec iaso ./manage.py shell
* Launch a postgresql shell    `docker-compose exec iaso ./manage.py dbshell`
* Create pending ORM migrationfiles `docker-compose exec iaso ./manage.py makemigrations`
* Apply pending ORM migrations `docker-compose exec iaso ./manage.py migrate`
* Show ORM migrations          `docker-compose exec iaso ./manage.py showmigrations`


### docker-compose run VS docker-compose exec

Run launch a new docker container, Exec launch a command it the existing container.

So `run` will ensure the dependencies like the database are up before executing. `exec` main advantage is that is faster
but you the container already running and lauched manually 

`run` will launch the entrypoint.sh script but exec will take a bash command to run which is why if you want
to run the django manage.py you will need to use `run iaso manage` but `exec iaso ./manage.py`

Also take care that `run` unless evoked with the `--rm` will leave you with a lot of left over containers that take up
disk space and need to be cleaned occasionally with `docker-compose rm` to reclaim disk space.

Running Django 3 on Elastic Beanstalk
-------------------------------------

Django 3 requires version 2+ of the gdal library. Sadly, Beanstalk is
based on Amazon Linux that can only install gdal 1 from the epel
repository. To be able to use gdal 2, first identify the AMI of the
Elastic Beanstalk EC2 server. In EC2, launch a new instance based on
that AMI. In the instance, run (based on
<https://stackoverflow.com/questions/49637407/deploying-a-geodjango-application-on-aws-elastic-beanstalk>
and adapted to use /usr instead of /usr/local): (For Amazon Linux 2, use
geos-3.5.2)

> wget <http://download.osgeo.org/geos/geos-3.4.2.tar.bz2> tar xjf
> geos-3.4.2.tar.bz2 cd geos-3.4.2 ./configure --prefix=/usr make sudo
> make install cd ..
>
> wget <http://download.osgeo.org/proj/proj-4.9.1.tar.gz> wget
> <http://download.osgeo.org/proj/proj-datumgrid-1.5.tar.gz> tar xzf
> proj-4.9.1.tar.gz cd proj-4.9.1/nad tar xzf
> ../../proj-datumgrid-1.5.tar.gz cd .. ./configure --prefix=/usr make
> sudo make install cd ..
>
> sudo yum-config-manager --enable epel sudo yum -y update
>
> sudo yum install make automake gcc gcc-c++ libcurl-devel proj-devel
> geos-devel autoconf automake gdal cd /tmp
>
> curl -L <http://download.osgeo.org/gdal/2.2.3/gdal-2.2.3.tar.gz> | tar
> zxf -cd gdal-2.2.3/ ./configure --prefix=/usr --without-python
>
> make -j4 sudo make install
>
> sudo ldconfig

Then go to Actions -> Image -> Create Image When it's ready, go to the
Beanstalk Instance Settings and specify the AMI reference of the image
we just created.

Containers and services
-----------------------

The list of the main containers:

*  iaso       The python backend in [Django](https://www.djangoproject.com/)
*  webpack    The JS frontend in react
*  db         [PostgreSQL](https://www.postgresql.org/) database

All the container definitions for development can be found in the
`docker-compose.yml`.

> **note**
>
> Postgresql uses Django ORM models for table configuration and
> migrations.

Tests and linting
-----------------

Tests can be executed with

``` {.sourceCode .bash}
docker-compose exec iaso ./manage.py test
```

Code reloading
--------------

In development the servers will reload when it detects a file
change, either in Python or Javascript. 

If you need to restart everything
``` {.sourceCode .shell}
docker-compose stop && docker-compose start
```

If you encounter problems, you can try to rebuild everything from
scratch.

``` {.sourceCode .shell}
# kill containers
docker-compose kill
# remove `iaso` container
docker-compose rm -f iaso
# build containers
docker-compose build
# start-up containers
docker-compose up
```

Code formatting
---------------

We have adopted Black [](https://github.com/psf/black) as our code
formatting tool. Line length is 120.

The easiest way to use is is to install the pre-commit hook: 1. Install
pre-commit: pip install pre-commit 2. Execute pre-commit install to
install git hooks in your .git/ directory.

Another good way to have it working is to set it up in your code editor.
Pycharm, for example, has good support for this.

The pre-commit is not mandatory but Continuous Integration will checks
if the formatting is respected!

React Intl
----------

It often blocks the deployment.

you can test the default message extraction with

``` {.sourceCode .shell}
# make sure you commit everything
npm run webpack-prod
git clean -n
git clean -f ..
```

Jupyter Notebook
----------------

To run a Jupyter Notebook, just activate the virtualenv and run

``` {.sourceCode .bash}
python manage.py shell_plus --notebook
```

Testing S3 uploads in development
---------------------------------

If you need to test s3 storage in development, you have to:

1.  Set the AWS\_STORAGE\_BUCKET\_NAME env variable to a bucket created
    for such tests
2.  Set the AWS\_ACCESS\_KEY\_ID and AWS\_SECRET\_ACCESS\_KEY env
    variables appropriately
3.  Set the USE\_S3 env variable to 'true'

These are actually exactly the same steps we use on AWS.

### Testing prod js assets in development
Run `TEST\_PROD=true docker-compose up`

to have a local environment serving you the production assets (minified
and with the same compilation option as in production). This can be
useful to reproduce production only bugs.

Enketo
------

To enable the Enketo editor in your local environment, you will have to
install our fork of enketo-express:

``` {.sourceCode .shell}
git clone https://github.com/BLSQ/enketo.git
cd setup/docker
docker-compose up
```

Then, you need to make sure your .env file is properly configured.
ENKETO\_URL should be set to http://192.168.1.15:81 (Replace
192.168.1.15 by your host)

To seed your DB with typical example forms, see the  Import data from DHIS2

# Workers


To execute task in the background, we use Elastic Beanstalk workers with
SQS using a fork of the library
[django-beanstalk-worker](https://pypi.org/project/django-beanstalk-worker/)
from tolomea. The endpoint /api/copy\_version/ is a good example of how
to create a task and to plug it to the api.

When calling a function with the @task decorator, it will add it to the
task queue. You are required to pass it a User objects, in addition to
the other function's argument, that represent which user is launching
the task. At execution time the task will receive a iaso.models.Task
instance in argument that should be used to report progress. It's
mandatory for the function, at the end of a successful execution to call
task.report\_success() to mark it's proper completion.

In local development you can call the url tasks/run\_all which will run
all tasks in queue.
