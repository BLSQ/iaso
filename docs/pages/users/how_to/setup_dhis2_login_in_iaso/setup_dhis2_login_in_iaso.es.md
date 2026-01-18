# Configurar inicio de sesión con DHIS2 para IASO

## En DHIS2 

### Ir a la configuración oauth

en el menú: 
```
System settings > Oauth 2 clients
Parametres Systeme > Oauth 2 clients
```


### Crear cliente oauth

Nombre: `iaso`
Seleccionar: authorization code
Url: necesita elegir un código único: `https://iaso.bluesquare.org/api/dhis2/<<unique-code>>/login/`


![image](https://user-images.githubusercontent.com/371692/173309528-fcc2a4c4-6eae-4731-9391-ba19ca054873.png)

## En admin django de IASO

### Crear un registro de credenciales externas

En admin django: https://iaso.bluesquare.org/admin/iaso/externalcredentials/

* Nombre: oauth client id
* Login: la url del dhis2
* Password: el oauth client secret
* Url: iaso

![external_auth](./attachments/external_auth.png)


### Habilitar el enlace dhis2 en el menú de IASO

para poder regresar fácilmente a dhis2
agregue la bandera de característica "SHOW_DHIS2_LINK" en el Proyecto 

![feature_flag](./attachments/feature_flag.png)

luego la entrada debería aparecer

![image](https://user-images.githubusercontent.com/371692/173310244-ec82e8b9-5821-4fb7-903d-0ea8631e46cc.png)


## En IASO 

### Vincular el usuario de IASO con un usuario de dhis2

en la interfaz general de IASO

![user](./attachments/user.png)

### Prueba


inicie sesión en dhis2 con el vinculado en el paso anterior 

`<<dhis2>>/uaa/oauth/authorize?client_id=<<unique-code>>&response_type=code`
  

luego "Autorizar": debería terminar en IASO


**¿No está funcionando?**

  - ¿Puso el mismo código en iaso/dhis2/url para iniciar sesión?
  - ¿El login en IASO external contiene la url del dhis2? 
  - ¿Está conectado en dhis2 con el usuario que vinculó al usuario de IASO?