
# Install enketo locally

```
git clone git@bitbucket.org:bluesquare_org/enketo-express.git
cd  setup/docker
docker-compose up
```

# in iaso fixture

xforms.xml adapt downloadUrl with your ngrok id

# iaso poc.py

adapt the ngrok url too

python poc.py

then open the url (without https)


# Reverse Engineer notes : Api calls from enketo

/enketo/formList/?formID=myformid

returns
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

the associated code in onadata
https://github.com/onaio/onadata/blob/8448894d3a78cb7dc49ef2cc4f89b3b317e0ae4e/onadata/apps/api/viewsets/xform_list_viewset.py

/enketo/forms/34369/form.xml

I assume return xml of xlsform from downloadUrl in previous request
but the page still says there is an error

/enketo/api/submission
should return headers[ 'x-openrosa-accept-content-length' ]  ?
https://github.com/kobotoolbox/enketo-express/blob/master/app/lib/communicator/communicator.js#L91
https://github.com/kobotoolbox/enketo-express/blob/master/app/lib/communicator/communicator.js#L103

HEAD + POST
https://github.com/onaio/onadata/blob/8448894d3a78cb7dc49ef2cc4f89b3b317e0ae4e/onadata/apps/api/viewsets/xform_submission_viewset.py#L102

http://127.0.0.1:81/submission/max-size/JndPHNja

POST /api/enketo/submission :  9241 bytes multipart/form-data;
  post request.FILES with instance xml and media files

TODO :
  - how to handle media files "upload" before edition



