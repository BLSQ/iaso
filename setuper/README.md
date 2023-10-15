Iaso Demo Setup script
----------------------

# Introduction 
The setuper.py script exists to help users or developer kickstart a fully working Iaso environment. 

It will:
- generate a random account name
- create the corresponding account, data source, source version, first user 
- import an org unit sample 
- import a test form
- create a few submissions of this form 

Once the script has run, you can log in to your server using the account name as login and password. 

# How To Use

```
python3 -m venv venv
pip install -r requirements.txt
source venv/bin/activate
cp data/sample-credentials.py credentials.py
#edit credentials.py with your own admin user credentials here
python3 setuper.py
```


