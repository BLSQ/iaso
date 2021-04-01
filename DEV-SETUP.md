# Setup of a dev environment
Welcome new developer. Follow these instructions to have a running Iaso instance on your machine. 
This assumes that you have installed docker, docker-compose and psql and that you are working in a CLI. 

Run  
```
docker-compose up db

psql --host=localhost --port=5433 -U postgres  postgres
```
(assuming you have psql on the command line)
Then  in psql
```
create database iaso; 
```

Now run the following command to create a super user giving you access to the admin: 
```
docker-compose run iaso manage createsuperuser
```

Run 
```
docker-compose up
```
to launch iaso now:

Go to http://localhost:8081/admin/iaso/account/
Create an account: Enter test as name and save

Go to http://localhost:8081/admin/iaso/project/add/
Create a project:  Enter test as name and test as account and save. 

Go to http://localhost:8081/admin/iaso/profile/
Create a profile with your user and the account test

Run the following command to populate your database with a tree of org units (these are childcare schools in the West of DRC)

```
docker-compose run iaso manage  tree_importer --org_unit_csv_file testdata/schools.csv --source_name wb_schools_2019 --version_number=1 --project_id=1 --main_org_unit_name maternelle
```

You can now access to see a map of these:
http://localhost:8081/dashboard/orgunits/list/locationLimit/3000/order/id/pageSize/50/page/1/tab/map/searchTabIndex/0/searchActive/true/searches/[%7B%22validation_status%22:%22all%22,%22color%22:%224dd0e1%22,%22source%22:3%7D]

Go to http://localhost:8081/dashboard/forms/list

Click create: 

fill the mandatory fields (name and projects), upload seed-data-command-cvs_survey.xls in the file box and add a bunch of org unit types in the selector. 

At this point, if you want to edit forms directly on your machine using enketo, go to the enketo setup section of the Readme. 

Once you are done, you can click on the eye for your newly added form, click on "create", tap a letter, then enter, select the org unit, then click "create a submission". 

If Enketo is running and well setup, you can fill the form now. 

You can now start to develop additional features on Iaso!