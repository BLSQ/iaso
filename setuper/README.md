Iaso Demo Setup Script
----------------------

# Introduction 
The setuper.py script exists to help users or developer kickstart a fully working Iaso environment. 

It will:
- generate a random account name
- create the corresponding account, data source, source version, first user 
- import an org unit sample 
- import a test form
- create a few submissions of this form 
- create a few entities

Once the script has run, you can log in to your server using the account name as login and password. 

# How To Use

```
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp data/sample-credentials.py credentials.py
#edit credentials.py with your own admin user credentials here and server url
python3 setuper.py
```



## Development


in a first terminal 
```
docker-compose up
```
in a second terminal launch the worker

```
docker-compose run iaso manage tasks_worker
```

then launch the setuper

```
python3 setuper.py
```