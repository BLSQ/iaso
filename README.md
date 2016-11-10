# Sense HAT

[![Build Status](https://api.travis-ci.com/eHealthAfrica/sense-hat.svg?token=zzNmUS8bNZp7na7r13qk)](https://travis-ci.com/eHealthAfrica/sense-hat)

This is the webapp for Sense HAT. The mobile companion app can be found [here](https://github.com/eHealthAfrica/sense-hat-mobile).

## Run

### Start the server

The local dev setup uses [docker-compose](https://docs.docker.com/compose/) to spin up all necessary services. Make sure you have docker-compose installed and can connect to the docker daemon. Then run in project directory:

`docker-compose up`

This will build and download the containers and start them. The `docker-compose.yml` file describes the setup of the containers. The web server should be reachable at `https://<docker-host>:8443`.

[Jupyter](http://jupyter.org/) iPython notebook server is run at port `8888` as well, that can be used for exploration in development.

No local setup should be needed apart from docker.

### Create a user

To login to the app or the django admin, a superuser needs to be created with:

`docker-compose run hat manage createsuperuser`

Then additional users with custom groups and permissions can be added through the django admin at `https://<docker-host>:8443/admin`.

### Import mobile backups

For the app to be able to decrypt mobile backups, it needs a privatekey. The key must be exported as env var `$HAT_MOBILE_KEY` and will be picked up by docker-compose. It can be found in Lastpass under `Backup private key`. The key is also needed to run the tests.

## Run commands on the server

Each docker container uses the same script as entrypoint. The `entrypoint.sh` script offers a range of commands to start services or run commands. The full list of commands can be seen in the script. The pattern to run a command is always `docker-compose run <container-name> <entrypoint-command> <...args>` The following are some examples:

- Run tests: `docker-compose run hat test`
- Run django manage.py: `docker-compose run hat manage help`
- Create a shell inside the container: `docker-compose run hat bash`
- Run a shell command `docker-compose run hat eval curl http://couchdb:5984`
- Create a python shell: `docker-compose run hat manage shell`

## Containers and services

The list of the main containers:

- **hat**: Django
- **db**: PostgreSQL database
- **couchdb**: CouchDB database for sync and raw data
- **rq**: [RQ python](http://python-rq.org/) task runner to perform jobs
- **redis**: Redis for task queueing and task result storage

All of the container definitions for development can be found in the `docker-compose.yml`.

Postgresql uses Django models for table configuration and migrations. CouchDB can be setup by a custom Django management command `manage setupcouchdb`.

## Tests and linting

Tests can be executed with `docker-compose run hat test`. This also runs [flake8](http://flake8.pycqa.org/en/latest/) to check the code. The tests need the `HAT_MOBILE_KEY` to be set.

### Fixtures

User fixtures can be loaded when testing. This is the list(<name>:<password>) of users:
- `admin:adminadmin`
- `supervisor:supervisorsupervisor`
- `importer:importerimporter`
- `full-exporter:exporterexporter`
- `anon-exporter:exporterexporter`

To export some data from the database to create fixtures run e.g.:
`docker-compose run hat manage dumpdata auth.User --indent 2`

To load some fixture into the database manually run e.g.:
`docker-compose run hat manage loaddata users`

## Code reloading

In development the django dev server will restart when it detects a file change. The task runner currently doesn't detect changes and will not automaticall restart. Restart the `redis` and `rq` containers to load the new code: `docker-compose restart redis rq`.

## Frontend Assets:

[See separate README](https://github.com/eHealthAfrica/sense-hat/blob/development/hat/assets/README.md)
