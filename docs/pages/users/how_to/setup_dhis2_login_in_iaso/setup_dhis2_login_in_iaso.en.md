# Setup login with dhis2 for iaso

## In DHIS2 

### Go in the oauth settings

in the menu : 
```
System settings > Oauth 2 clients
Parametres Systeme > Oauth 2 clients
```


### Create oauth client

Name :  `iaso`
Select : authorization code
Url : you need to pick a unique code : `https://iaso.bluesquare.org/api/dhis2/<<unique-code>>/login/`


![image](https://user-images.githubusercontent.com/371692/173309528-fcc2a4c4-6eae-4731-9391-ba19ca054873.png)

## In iaso django admin

### Create an external credentials record

In django admin : https://iaso.bluesquare.org/admin/iaso/externalcredentials/

* Name : oauth client id
* Login: the url of the dhis2
* Password: the oauth client secret
* Url : iaso

![external_auth](./attachments/external_auth.png)


### Enable the dhis2 link in the iaso menu

to be able to easily go back to dhis2
add the feature flag "SHOW_DHIS2_LINK" on the Project 

![feature_flag](./attachments/feature_flag.png)

then the entry should appear

![image](https://user-images.githubusercontent.com/371692/173310244-ec82e8b9-5821-4fb7-903d-0ea8631e46cc.png)


## In iaso 

### Link the iaso user with a dhis2 user

in iaso general ui

![user](./attachments/user.png)

### Test


login in dhis2 with the linked in previous step 

`<<dhis2>>/uaa/oauth/authorize?client_id=<<unique-code>>&response_type=code`
  

then "Authorize": you should end up in iaso


**It's not working ?**

  - Did you put the same code in iaso/dhis2/url to login ?
  - The login in iaso external contains the url of the dhis2 ? 
  - Are you logged in dhis2 with the user you linked the iaso user ? 