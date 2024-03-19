# Environnement variables

## DB connection related

the url is build based on the following env variables
```
RDS_USERNAME
RDS_PASSWORD
RDS_HOSTNAME
RDS_DB_NAME
RDS_PORT
```

the SQL dashboard use a dedicated user/password with readonly access to the data

```
DB_READONLY_USERNAME 
DB_READONLY_PASSWORD
```

## AWS related

Storing the various files like
 - js/css/... static assets
 - raw forms (xlsform), submissions (xml and media),... is done in s3 (or an s3 compatible api like minio)

```
AWS_ACCESS_KEY_ID:
AWS_SECRET_ACCESS_KEY:
AWS_S3_REGION_NAME
AWS_STORAGE_BUCKET_NAME:
AWS_S3_ENDPOINT_URL: (used to for ex to point to minio)
```

for async task

```
BACKGROUND_TASK_SERVICE    : default to SQS :  possible values are  SQS POSTGRES
BEANSTALK_SQS_REGION
BEANSTALK_SQS_URL

```
## Disabling login through passwords

In case you wish to deactivate passwords using login:

- in the basic login page
- to connect to the admin
- through /api/token , which is used by default by the mobile application 

you can set the environment variable `DISABLE_PASSWORD_LOGINS`to the value`"true"`

## Sentry related

If you don't provide a SENTRY_URL, sentry won't be configured


| name                                   | optional  | default value   | description                             |---|
|----------------------------------------|-----------|-----------------|-----------------------------------------|---|
| SENTRY_URL                             |  true     | -               |  url specific to your sentry account    |   |
| SENTRY_ENVIRONMENT                     |  true     | development     |  environnement (dev, staging, prod,...) |   |
| SENTRY_TRACES_SAMPLE_RATE              |  true     |   0.1           |  float between 0 and 1 : send 10%       |   |
| SENTRY_ERRORS_SAMPLE_RATE              |  true     |   1.0           |  float between 0 and 1 : send everything|   |
| SENTRY_ERRORS_HTTPERROR_SAMPLE_RATE    |  true     |   0.8           |  float between 0 and 1 : send 80% of the errors | |  

     