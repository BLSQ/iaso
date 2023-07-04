Fixture provide a way to have sample test data in your database.

They can be written manually or extracted from a database.

See the Django documentation for more information:
* [Fixtures](https://docs.djangoproject.com/en/4.1/howto/initial-data/)
* [Testing tool. Loading data](https://docs.djangoproject.com/en/4.1/topics/testing/tools/#topics-testing-fixtures)

We use these files in the automated unit test !

    
(this readme assume ./m is your manage.py)


To create a temporary server with only the fixtures's data:
```
./m testserver --noinput iaso/fixtures/user.yaml  iaso/fixtures/orgunit.yaml
```
This will create a separate DB and load your data in it. Your existing data won't be lost. Your data will be lost after stopping the server.


To load the fixture data in your current Database, use the loaddata command:
```
./m loaddata plugins/polio/fixtures/campaign.yaml
```

WARNING This will override your existing data. Do not execute in a production environment



To redump the OrgUnit data after modification. 
```
./m dumpdata  --format yaml --natural-foreign --natural-primary --indent=2 --traceback  iaso.datasource iaso.sourceversion iaso.externalcredentials  iaso.orgunittype iaso.orgunit iaso.account --output iaso/fixtures/orgunit.yaml
```
This will take the data in your database and dump them in the file


For the Budget
```bash
./m dumpdata  --format yaml --natural-foreign --natural-primary --indent=2 --traceback  iaso.team polio.workflowmodel --output iaso/fixtures/polio/budget.yaml
```
