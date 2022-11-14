Fixture provide a way to have sample test data in your database.

See the Django documentation for more information
* [Fixtures](https://docs.djangoproject.com/en/4.1/howto/initial-data/)
* [Testing tool. Loading data](https://docs.djangoproject.com/en/4.1/topics/testing/tools/#topics-testing-fixtures)

We use these files in the automated unit test !

(this readme assume ./m is your manage.py)

To redump the OrgUnit data after modification
```
/m dumpdata  --format yaml --natural-foreign --natural-primary --indent=2 --traceback  iaso.datasource iaso.sourceversion iaso.externalcredentials  iaso.orgunittype iaso.orgunit iaso.account --output iaso/fixtures/orgunit.yaml
```


To create a temporary server with only the fixtures data:
```
./m testserver --noinput iaso/fixtures/user.yaml  iaso/fixtures/orgunit.yaml
```
WARNING This will not override your existing data. Do not execute in a production environment


To load the fixture data in your current instance:
this will override your existing data


