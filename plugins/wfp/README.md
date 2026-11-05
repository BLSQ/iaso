# ETL for Coda2

A plugin adding extract and transform for data from coda 2 in the format expected by the Tableau dashboards.

Currently, it reads and writes to the same database as the Coda2 installation.

## Quick start

1. Set up the env variables PLUGINS to "wfp" to activate the plugin
2. Set up the environment variables read by the script to access the redis task backend

```
    CELERY_BROKER_URL
    CELERY_RESULT_BACKEND
```

Both have default value of `redis://localhost:6379`

3. Run `docker compose run iaso manage migrate wfp` to create the wfp specific database tables.
4. To test if the setup is correct outside of celery, run `docker compose run iaso manage etl_ssd`
5. The name of the module to run by celery is `hat`: `python -m celery -A hat worker -l info` should give you the list of available tasks.
6. You now have two celery task that can be triggered:

```
  plugins.wfp.tasks.etl_ssd
  plugins.wfp.tasks.etl_ng
```

7. Run python test `docker compose run iaso manage test -k ETL`


Once the ETL has run, users having access to the admin interface can also use the 
debug interface located at /wfp/debug/id_of_an_entity/ to see the data computed 
by the ETL for a given entity.


## Beneficiaries page and exports in the dashboard

The beneficiaries computed by the ETL are listed in the dashboard under **Entities > WFP beneficiaries**
(`/dashboard/entities/wfp-beneficiaries`), with their journeys and visits. From there users export them in the
"CODA 2.0" format or as raw data (the ETL tables and the submissions, one sheet per form).

- The page and the exports need the `iaso_wfp_beneficiary_export` permission (group "Entities", module
  `ENTITIES`). Personal data (PII fields of the forms) is only exported for users having `iaso_submissions_pii`.
- Users restricted to some org units only see and export the visits made in them.
- The export buttons download the file right away: it is built in the request with the filters of the list, nothing
  is stored.
- JSON API: `/api/wfp/beneficiaries/` (list, `options/`), `/api/wfp/beneficiaries/export/coda/` and
  `/api/wfp/beneficiaries/export/raw/` (xlsx files, same query params as the list).

The page is the React page of the plugin (`plugins/wfp/js`). The older HTML screen at `/wfp/beneficiaries/` is kept
for debugging and needs the same permission.
