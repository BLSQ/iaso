
# 0. Make sure everything is there

- run the tests
- check with team mates

For IASO deployment make sure you ran eb init with following info


```
eb init
Select a default region
5) eu-central-1 : EU (Frankfurt)
Select an application to use
4) Iaso
Do you wish to continue with CodeCommit? (y/N) (default is n): n
```
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

# 2. Deploy to playground

For the Playground, deploy as for staging and prod for the web server, but you also need to update the
jupyter server (using the pem file you can find on 1password)

```
ssh -i lightsail.pem ubuntu@18.196.197.98
cd sense-hat
git pull
source bin/activate
pip install -r requirements.txt
killall python
nohup ./run.sh &
```

Obviously, a more stable playground setup would be welcome.