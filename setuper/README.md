# Iaso Demo Setup Script

## Introduction

The setuper.py script:

- kickstarts a fully working Iaso environment
- by generating contents for the database
- using the Iaso API

It will:

- generate a random account name
- create the corresponding account, data source, source version, first user 
- import an org unit sample 
- import a test form
- create a few submissions of this form 
- create a few entities

Once the script has run, you can log in to your server using the account name as login and password. 

## How To Use

1. Backup your DB

        docker-compose exec db pg_dump -U postgres iaso  -Fc > ~/Desktop/iaso.dump

1. Use an empty DB

        # Find your Iaso DB.
        docker-compose exec db psql -U postgres -l

        # Delete your Iaso DB.
        docker-compose exec db psql -U postgres -c "drop database if exists iaso"

        # Create your Iaso DB.
        docker-compose exec db psql -U postgres -c "create database iaso"

1. Run the Django server in a first terminal (this will run DB migrations)

        docker-compose up iaso

1. Run a worker in a second terminal

        docker-compose run iaso manage tasks_worker

1. Create a superuser

        docker-compose exec iaso ./manage.py createsuperuser

1. Prepare the setuper (it requires a local Python 3)

        cd setuper

    - Create a virtual env for your local Python:

           python3 -m venv venv
           source venv/bin/activate

   - Install requirements:

           pip install -r requirements.txt

    - Update `credentials.py` because we need a user with API access (use your superuser credentials)

          cp data/sample-credentials.py credentials.py

1. Run the setuper

        python3 setuper.py
