# How to create registry in web interface

**Use case**: develop or test registry related features in the web interface


## 1. Get some Submission

Select a submission you are going to use has `reference_instance` in an org unit.

## 2. Get some Org unit

We will use one organization unit and link a reference submission to it.
Make sure you choose a org unit having children and that they are all validated.
Make also sure that the type of this org unit has sub org unit types, and that those sub types are those used by the children org units.
This org unit should have a shape and be visible by the account you are using.
Children should also be visible, location (point or shape) is not mandatory.


## 3. Add reference instance to org unit

- Go to `/admin``
- Open the `Org units` menu entry
- Edit the org unit we choosed at step 2
- copy the id of the submission we choosed at step 1 in `Reference instance` field
- save

## 4. Optionnal: create submissions for children

- Go to Forms > Submissions
- Using the filters, search for a form, doesn't need to be a specific one
- For each children of the main org unit, create a submission

Note: To be able to create submissions, Enketo needs to be running. This can be done with the following command: `docker-compose -f docker-compose.yml -f docker/docker-compose-enketo.yml up`


## 5. Test registry page

- Go to Org units > Registry
- Search for the main org unit we choosed in step 2
- Click on `View registry`
- You should see the registry page, showing a map of the org unit with the children, the reference instance on the right
- If you click on list tab, you should see the list of children org units, including those without a location
- if you completed step 4, you can select the form you used in this step in the dropdown and check that those submissions are present at the bottom of the page
- You can find an example of registry [here]([/guides/content/editing-an-existing-page](https://iaso-staging.bluesquare.org/dashboard/orgunits/registry/details/accountId/16/orgUnitId/1688480/formIds/149/tab/185)) on staging. Credentials are in 1Password, look for `registry-demo`