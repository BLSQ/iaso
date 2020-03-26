
# 0. Make sure everything is there

- run the tests
- check with team mates

# 1. Prepare assets

To avoid long/failing deployment, we commit the production assets in the repository

```
git checkout development
git pull
rm hat/assets/webpack/*
npm run webpack-prod
git add hat/assets/webpack/
git commit -m 'Committing assets'
git push
```

Troubleshooting :

 - npm install : might be needed
 - react intl : might fails see this PR for some sort of [solution](https://bitbucket.org/bluesquare_org/sense-hat/pull-requests/408)

# 2. Deploy to staging

Make sure you have eb installed and run eb init

Then you deploy the `development` branch to [staging](https://iaso-staging.bluesquare.org)

```
eb use Iaso-staging
eb deploy
```

eb deploy will take of (via container commands see ./.ebextensions/50_container_commands.config)

 - deploying
 - copying the resources and putting them in S3
 - running the pending migrations

Troubleshooting :

 - you might need to dig in the [eb activity logs](https://eu-central-1.console.aws.amazon.com/elasticbeanstalk/home?region=eu-central-1#/environment/logs?applicationName=Iaso&environmentId=e-rmmcdsjkkr)

TODO martin is there any sanity check ?

# 2. Deploy to production

Merge development in master, and deploy master in production

```
git checkout master
git pull
git merge development
git push

eb use Iaso-env
eb deploy
```

Check the [production](https://iaso.bluesquare.org)


Troubleshooting :

 - you might need to dig in the [eb activity logs](https://eu-central-1.console.aws.amazon.com/elasticbeanstalk/home?region=eu-central-1#/environment/dashboard?applicationName=Iaso&environmentId=e-esgyumhrjp)

TODO martin what about iaso-playground and notebooks ?