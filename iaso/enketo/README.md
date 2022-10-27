Enketo is another service, used to present Form to users, so they can use them. This document explain how to set it up
locally and how the connexion between the two works. 

This package contain utilities functions to interact with the ENKETO server. A part of the logic is in the API in `iaso/api/enketo.py`.
See main README for more information

TODO: Document which Enketo version we support and have tested with.

# Running Enketo in you dev environment
See the Enketo directory section from the Main readme.md on how to launch Enketo in your docker compose environment

Iaso used to have a fork of Enketo to run in dev mode but nowawdays you can use the mainstream one at https://github.com/enketo/enketo-express


## Configuration in Iaso
To populate your Iaso database with Form and Org Unit, as well as sample submission that you can use with your local Enketo, you can use the seed command. That will retrieve these information from the sample DHIS2 server.

First Run:
```
docker-compose  up

docker exec -it iaso_1 bash -c './manage.py seed_test_data --mode=seed --dhis2version=2.31.8'
```

Note that the content of the created Submission (in their "json" and "xml" ) don't match the provided xlsform. So the edit will "work", but the json will dramatically change.

Then in the Iaso Dashboard, got to the instance details of Quantity PCA form 2.31.8

Then in the FAB (Floating action button, on the top right) button you can Edit : Modifier les réponses via enketo.


# HOW TO manually test Enketo public_create_url

Ensure you have a usable project, form (with form version etc..) and an orgunit in iaso. And Enketo is working. You should be able to make a submission from the web interface. Do it to verify everything

Edit the Project in Django admin. And copy the external token
It's automatically generated, so you should always have one

`token='bdba9384-bcd7-4f39-a8e3-310f5ba309ee'`

Still in the admin, take the form_id on the Form (caution: this is an external id, a string, different from the form.id) You should have one if you uploaded a correct FormVersion

`form_id= 'FORM_A_Tool'`

On the OrgUnit take the external token: (it's in the dashboard)

`external_org_unit_id= "AO001000000000000000"`

Make an url with it:
```
f"/api/enketo/public_create_url/?period={period}&form_id={form_id}&token={token}&external_org_unit_id={external_org_unit_id}"

=> '/api/enketo/public_create_url/?period=202301&form_id=FORM_A_Tool&token=bdba9384-bcd7-4f39-a8e3-310f5ba309ee&external_org_unit_id=AO001000000000000000'
```

Iaso will return a json with a URL, open it.
Fill the form.

To test the export, add the `to_export=true` argument. You will need FormMapping and a DHIS2 configuration to test the full export



# Old notes on implementations
Warning some part might not be up-to-date.

TODO : check which part are still relevant

## Implementation details

currently everything is in enketo.py and enketo_url.py

the client ask for edit url with the instance
we hide in the meta tags the editUserID with its id
the client redirect to enketo

instanceId is the uuid in meta.instanceID xml tag

when the user submit the modifoed form in enketo
it comes back to iaso with a new meta.instanceID
and the meta.deprecateID is filled with the previous uuid
we can find back the user based on the editUserId
we log modifications and store the new media files


## Reverse Engineering notes : Api calls from enketo

/enketo/formList/?formID=myformid

returns
```
<xforms xmlns="http://openrosa.org/xforms/xformsList">
	<xform>
		<formID>myformid</formID>
		<name>qlty_pca_04_partie_financier</name>
		<version>201503160816</version>
		<hash>md5:2eb75f0914a60c97ce471d6da118e42b</hash>
		<descriptionText>entites_skv_sante</descriptionText>
		<downloadUrl>https://iaso/api/enketo/forms/34369/form.xml</downloadUrl>
	</xform>
</xforms>
```

the associated code in onadata
https://github.com/onaio/onadata/blob/8448894d3a78cb7dc49ef2cc4f89b3b317e0ae4e/onadata/apps/api/viewsets/xform_list_viewset.py

/enketo/forms/34369/form.xml

I assume return xml of xlsform from downloadUrl in previous request
but the page still says there is an error

/enketo/api/submission
should return headers[ 'x-openrosa-accept-content-length' ]  ?
https://github.com/kobotoolbox/enketo-express/blob/master/app/lib/communicator/communicator.js#L91
https://github.com/kobotoolbox/enketo-express/blob/master/app/lib/communicator/communicator.js#L103

```
HEAD + POST
https://github.com/onaio/onadata/blob/8448894d3a78cb7dc49ef2cc4f89b3b317e0ae4e/onadata/apps/api/viewsets/xform_submission_viewset.py#L102

http://127.0.0.1:81/submission/max-size/JndPHNja

POST /api/enketo/submission :  9241 bytes multipart/form-data;
  post request.FILES with instance xml and media files

TODO :
  - how to handle media files "upload" before edition
```

