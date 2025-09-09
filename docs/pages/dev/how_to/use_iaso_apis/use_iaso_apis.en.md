It's a relatively standard json based API built using the Django Rest Framework. 

Here is a sample Python script showing how to fetch your list of submissions: 

```
import os
import requests

# API setup
server = "https://iaso.bluesquare.org"
creds = {
    "username": USERNAME,
    "password": PASSWORD
}

instances_endpoint = server + "/api/instances/"

# get API token
r = requests.post(server + "/api/token/", json=creds)

token = r.json().get('access')
headers = {"Authorization": "Bearer %s" % token}

# request submissions data
r = requests.get(instances_endpoint,
                 headers=headers)

j = r.json()
```

Most endpoints of Iaso provide exports to csv through the mechanisms provided by the Django Rest Framework (by adding ``format=csv`` to the url) and some of them provide exports to xlsx (``xlsx=true``) and geopackage (``gpkg=true``) formats.