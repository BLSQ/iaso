# How to create entities in web interface

**Use case**: develop or test entity related features in the web interface

## 1. Get some XLS Forms

At least one form will be needed as reference form. More would be optimal as it would allow to test the follow-up feature.


## 2. Create Forms and form versions

For each XLS form:

- Open the menu, go to Forms
- Click the Create button
- Fill in all mandatory fields and Save
- Click the Create Version button
- Use an XLS form to create the version

## 3. Create one or several `EntityType`s

- From the menu, go to Beneficairies > Beneficiary types
- Click create
- Assign one of the created forms as reference form for the benefiacry type

Repeat as needed

## 4. Create submissions for the reference form(s)

- Go to Forms > Submissions
- Using the filters, search for the reference form(s) that were created in the previous step
- For each form, create a submission

Note: To be able to create submissions, Enketo needs to be running. This can be done with the following command: `docker-compose -f docker-compose.yml -f docker/docker-compose-enketo.yml up`

## 5. Create `Entities` with the Django admin

- Go to `/admin``
- Open the `Entities` menu entry
- Fill in the mandatory fields
- Associate one of the newly created submissions to the `Entity`. It should be a submission for the form defined as reference form for the `EntityType` of the `Entity` being created.
- Save
- Repeat as needed.