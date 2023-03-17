# How Iaso is deployed on AWS

on ElasticBeanstalk + RDS
![schema archi iaso.svg](schema%20archi%20iaso.svg)
---
## Main parts 
- Creation of the HOST environment where the Iaso code will be deployed as well as the related services
- The deployment of the code itself and of new version

---

## Host infrastructure
This documentation concerned the main Iaso deployment, that are done on AWS.

The main pillar is *AWS  Elastic beanstalk*

Which is kind of a magic solution from Amazon that tie several of their service together, handle deployment logic, etc...

In the past we configured it by hands but now we are moving toward having it  all handled via Terrraform so it is in code (we can have an history, avoid misclick, do complex ops etc...).

The technical term for this is "Provisioning" if you want to look it up.


## Setup of the Elastic Beainstalk
See  
https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/create-deploy-python-django.html

We have custom commands and configuration in [.ebextensions/](.ebextensions/) and in 
and in [.platform/](.platform/) to extend the nginx config.

## Running Django 3 on Elastic Beanstalk / Custom AMI

Django 3 requires version 2+ of the gdal library. Sadly, Beanstalk is
based on Amazon Linux that contain an outdated version of GDAL.

To fix this you have to create  a custom AMI to use in your Elastic Beanstalk
environments and compile and your own version of gdal and it's dependencies.

See the [AWS documentation on creating adn using a custom AMI](
https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/using-features.customenv.html)
and the [Django documentation on compiling the GIS libraries](https://docs.djangoproject.com/en/4.1/ref/contrib/gis/install/)

Custom build of the following libraries were done:

* geos
* SQLite
* proj
* proj-data
* spatialite
* gdal

You can check `scripts/create_ami.sh` for reference

Read [AWS documentation on creating adn using a custom AMI](
https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/using-features.customenv.html)
but in summary:

1. First identify the AMI of the Elastic Beanstalk EC2 server.
2. In EC2, launch a new instance based on that AMI. 
3. Don't forget to set in the advanced section:
```yaml
#cloud-config
  repo_releasever: repository version number
  repo_upgrade: none
```
1. Connect via SSH to the instance
2. Install the dependencies (see scripts/create_ami.sh)
3. Then go to Actions -> Image -> Create Image
4. When it's ready, go to the Beanstalk Instance Settings and specify the AMI reference of the image we just created.


---
## Where is the code ?

Infrastructure and configuration in the Github repository
[BLSQ/terraform-iaso-eb](https://github.com/BLSQ/terraform-iaso-eb) There is good documentation from Mbayang in the `docs/` folder. Visibility is restricted.

In the `BLSQ/iaso` Github repository:
* `.github` For the workflow info
* `scripts/`
* `.ebextension` For the Elastic beanstalk specific command
* `.platform` Configuration override

---
## Related services
* S3 bucket: For the static and the user uploaded media (in AWS)
* Enketo (in another AWS Elastic Beanstalk)
* Postgresql RDS (in AWS)
* Queue Service for background Worker  (in AWS SQS)
* Sentry: error handling and notification (as Saas)
* MailGun (as Saas)
* Route53: DNS redirection (in AWS)

---
Two type of env in elastic beanstalk:
* web
* worker

We tie them via an "env" tag in AWS, so we can deploy them at the same time

One Elastic Beanstalk Env can contain multipe "EC2 Instance", that is virtual machine server.  Their number auto scale according to rule in elastic beanstalk.
Usually we have 1 instance for Worker and 2 for Web.

---
# S3 bucket
* Static: Push static in them so they can be properly cached and CDN (not sure we actually do this)
* Media: Store uploaded media by the users : Form response (XML), media attached to Form response (photos), gpkg, form definition, etc.. 

Static are readable by all.

Media are only accessible via Signed url that expire after a laps of time (15 minutes I think) and that are generated on the fly by iaso when needed.


 
---
# CI/CD
Deployment of new version is done via Github action.

Each change on main are automically deployed on the staging environment

Deployment to other env have to be manually triggered

---

### Deployement process 
How a new version of Iaso is deployed

This is a simplified view, some details are omitted for clarity

1. A user trigger the deploy worflow in github actions (or it is trigger automatically for staging)
2. In the github worker: (code in .github/workflows/deploy.yml)
	1. Determine version number. Call set_version to set it.
	2. It build all the JS/CSS and other ressource for the front-end
	3. Add the to the git repo
	4. scripts/eb-deploy.py:
		1. Connect to the AWS api to fetch all the _beanstalk environments_ for the `iaso` environment. e.g. : `staging` -> `iaso-staging2` and `iaso-staging2-worker`
		2. For each beanstalk env, trigger `eb deploy` (from awseb cli):
			1. Make a zip file of the content of the git repo (done by eb deploy). Including the compiled asset
			2. Call ElasticBeanstalk API to deploy it
3. In the Iaso servers (EC2 instances): Our code/config for this is in the directory `.ebextensions` Action markqe with ¥ are part of Elastic beanstalk logic
	1. Deployment is triggered ¥
	2. New app version is copied in `/var/app/staging` ¥
	3. The dependencies in requirements.txt are installed  ¥
	4. [Our logic](https://github.com/BLSQ/iaso/blob/main/.ebextensions/50_container_commands.config) is executed
		1. Server translations are compiled
		2. **The frontend (compiled JS, image, css) is pushed to the S3 bucket.**
		3. **Database migration are done**
		4. Cache table is created
	5. `/var/app/staging` is moved in `/var/app/current` ¥
	6. If these steps fail, Elastic beanstalk will do a *rollback* and revert to the previous version. Note since we do manually the maching between worker and web, sometime we have the problem that one is rolled back and not the other and we have a version mismatch. We sometime also have the problem with incompatible database migrations. ¥
	7. Send a Slack notification to notify of the success of failure of the github deployment.



---
# Related services in more details
* S3 bucket: For the static and the user uploaded media (in AWS)
* Enketo (in another AWS Elastic Beanstalk)
* Postgresql RDS (in AWS)
* Queue Service for background Worker  (in AWS SQS)
* Sentry: error handling and notification (as Saas)
* MailGun (as Saas)
* Route53: DNS redirection (in AWS)

---
### Enketo

Deployed separately, handled via Elastic Beanstalk also, linked to Iaso via environment variable. Mbayang manage this

---
### AWS SQS
Queue system used for Worker, see worker section in README

---
### S3 bucket
S3 see above


# Architecture inside the VM
Code is in the `/var/app/current`

Systemctl launch the web server  as the `web` unit. This is done via Gunicorn under the web user, gunicorn launch multiple Django server.

There is a NGINX in front of gunicorn.
The above is handled automatically via Iaso

The logs can be listed inside the VM via `journalctl -u web`

We have 2 crons (for now). They can be seen  by using `systemctl list-timers`

