Code formatting
---------------

We have adopted Black [](https://github.com/psf/black) as our code
formatting tool. Line length is 120.

The easiest way to use is is to install the pre-commit hook:
1. Install pre-commit: pip install pre-commit
2. Execute pre-commit install to install git hooks in your .git/ directory.

Another good way to have it working is to set it up in your code editor.
Pycharm, for example, has good support for this.

The pre-commit is not mandatory but Continuous Integration will check
if the formatting is respected!

Tests and linting
-----------------

For the Python backend, we use the Django builtin test framework. Tests can be executed with

``` {.sourceCode .bash}
docker-compose exec iaso ./manage.py test
```

Translations
------------

The few translation for the Django side (login and reset password email etc..)
are separated from the test. We only translate the template for now
not the python code (string on model or admin).

When modifying or adding new strings to translate, use the following command to
regenerate the translations:

```manage.py makemessages --locale=fr --extension txt --extension html```

This will update `hat/locale/fr/LC_MESSAGES/django.po` with the new strings to
translate.

After updating it with the translation you need to following command to have
them reflected in the interface:

```manage.py compilemessages```


Code reloading
--------------

In development the servers will reload when they detect a file
change, either in Python or Javascript. If you need reloading for the bluesquare-components code, see the "Live Bluesquare Components" section. 

Troubleshooting
---------------

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

Jupyter Notebook
----------------

To run a Jupyter Notebook, just copy the env variable from runaisasdev.sh, activate the virtualenv and run

``` {.sourceCode .bash}
python manage.py shell_plus --notebook
```

Deployment on AWS Elastic Beanstalk
====================================

See also [How to deploy wiki](https://github.com/BLSQ/iaso/wiki/How-to-deploy)

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

During local development, by default, the Javascript and CSS will be loaded from
a webpack server with live reloading of the code. To locally test the compiled
version as it is in production ( minified and with the same compilation option).
You can launch docker-compose with the `TEST_PROD=true` environment variable
set.

e.g `TEST_PROD=true docker-compose up`

This can be useful to reproduce production only bugs. Please also test with this
configuration whenever you modify webpack.prod.js to validate your changes.

Alternatively this can be done outside of docker by running:

1. `npm run webpack-prod` to do the build
2. Launching the django server with `TEST_PROD`
   e.g. `TEST_PROD=true python manage.py runserver`.

# Background tasks & worker

Iaso queue certains functions (task) for later execution, so they can run
outside an HTTP request. This is used for functions that take a long time to execute
so they don't canceled in the middle by a timeout of a connection closed.
e.g: bulk import, modifications or export of OrgUnits.  Theses are the functions
marked by the decorator @task_decorator, when called they get added to a Queue
and get executed by a worker.


The logic is based on a fork of the library
[django-beanstalk-worker](https://pypi.org/project/django-beanstalk-worker/)
from tolomea, please consult it's doc for reference.

In production on AWS, we use Elastic Beanstalk workers which use a SQS queue.

In local development, you can run a worker by using the command:
```
docker-compose run iaso manage tasks_worker
```

Alternatively, you can call the url `tasks/run_all` which will run all the pending tasks in queue.

If you want to develop a new background task, the endpoint `/api/copy_version/`
is a good example of how to create a task and to plug it to the api.

To call a  function with the @task decorator, you need to pass it a User objects, in addition to
the other function's arguments, this arg represent which user is launching
the task. At execution time the task will receive a iaso.models.Task
instance in argument that should be used to report progress. It's
mandatory for the function, at the end of a successful execution to call
task.report_success() to mark its proper completion.