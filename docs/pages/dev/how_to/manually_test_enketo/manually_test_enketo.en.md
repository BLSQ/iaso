# Manually test Enketo public_create_url

Ensure you have a usable project, form (with form version etc..) and an orgunit in iaso. And Enketo is working. You should be able to make a submission from the web interface. Do it to verify everything

Edit the Project in Django admin. And copy the external token
It's automatically generated, so you should always have one

`token='xxxxxxxxx-xxxx-xxxxx-xxxxx-xxxxxxxxx'`

Still in the admin, take the form_id on the Form (caution: this is an external id, a string, different from the form.id) You should have one if you uploaded a correct FormVersion

`form_id= 'FORM_ID'`

On the OrgUnit take the external token: (it's in the dashboard)

`external_org_unit_id= "AAAA0000000000"`

Make an url with it:
```
f"/api/enketo/public_create_url/?period={period}&form_id={form_id}&token={token}&external_org_unit_id={external_org_unit_id}"
=> '/api/enketo/public_create_url/?period=202301&form_id=FORM_ID&token=xxxxxxxxx-xxxx-xxxxx-xxxxx-xxxxxxxxx&external_org_unit_id=AAAA0000000000'
```

Iaso will return a json with a URL, open it.
Fill the form.

To test the export, add the to_export=true argument. You will need FormMapping and a DHIS2 configuration to test the full export