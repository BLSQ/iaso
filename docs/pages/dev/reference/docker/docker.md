# Docker

### Run commands inside the docker container

Each docker container uses the entrypoint.

The `entrypoint.sh` script offers a range of commands to start services or
run commands. The full list of commands can be seen in the script. The
pattern to run a command is

```bash
docker-compose run <container-name> <entrypoint-command> <...args>
```

The following are some examples:

* Run tests                    `docker-compose exec iaso ./manage.py test`
* Create a shell inside the container    `docker-compose run iaso bash`
* Run a shell command          `docker-compose run iaso eval curl http://google.com`
* Run Django manage.py         `docker-compose exec iaso ./manage.py help`
* Launch a python shell        `docker-compose exec iaso ./manage.py shell`
* Launch a postgresql shell    `docker-compose exec iaso ./manage.py dbshell`
* Create pending ORM migration files `docker-compose exec iaso ./manage.py makemigrations`
* Apply pending ORM migrations `docker-compose exec iaso ./manage.py migrate`
* Show ORM migrations          `docker-compose exec iaso ./manage.py showmigrations`
* To run a background worker   `docker-compose run iaso manage tasks_worker`

### Containers and services

*  iaso       The python backend in [Django](https://www.djangoproject.com/)
*  webpack    The JS frontend in react
*  db         [PostgreSQL](https://www.postgresql.org/) database

All the container definitions for development can be found in `docker-compose.yml`.

### docker-compose run vs. docker-compose exec

`docker-compose run` launches a new docker container, `docker-compose exec` launches a command in the existing container.

So `run` will ensure the dependencies like the database are up before executing. `exec` main advantage is that it is faster
but the containers must already be running (launched manually) 

`run` will launch the entrypoint.sh script but exec will take a bash command to run which is why if you want
to run the django manage.py you will need to use `run iaso manage` but `exec iaso ./manage.py`

Also take care that `run` unless evoked with the `--rm` will leave you with a lot of left over containers that take up
disk space and need to be cleaned occasionally with `docker-compose rm` to reclaim disk space.