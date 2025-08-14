# Cómo se despliega Iaso en AWS

en ElasticBeanstalk + RDS
![schema archi iaso.svg](schema%20archi%20iaso.svg)
---
## Partes principales 
- Creación del entorno HOST donde se desplegará el código de Iaso así como los servicios relacionados
- El despliegue del código en sí y de nuevas versiones

---

## Infraestructura del host
Esta documentación se refiere al despliegue principal de Iaso, que se realiza en AWS.

El pilar principal es *AWS Elastic beanstalk*

Que es una especie de solución mágica de Amazon que vincula varios de sus servicios, maneja la lógica de despliegue, etc...

En el pasado lo configurábamos a mano, pero ahora nos estamos moviendo hacia tenerlo todo manejado vía Terraform para que esté en código (podemos tener un historial, evitar errores de clic, hacer operaciones complejas, etc...).

El término técnico para esto es "Provisioning" si quieres buscarlo.


## Configuración del Elastic Beanstalk
Ver  
https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/create-deploy-python-django.html

Tenemos comandos personalizados y configuración en [.ebextensions/](.ebextensions/) y en 
y en [.platform/](.platform/) para extender la configuración de nginx.

## Ejecutando Django 3 en Elastic Beanstalk / AMI personalizada

Django 3 requiere la versión 2+ de la biblioteca gdal. Lamentablemente, Beanstalk está
basado en Amazon Linux que contiene una versión desactualizada de GDAL.

Para solucionar esto, tienes que crear una AMI personalizada para usar en tus entornos Elastic Beanstalk
y compilar tu propia versión de gdal y sus dependencias.

Ver la [documentación de AWS sobre crear y usar una AMI personalizada](
https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/using-features.customenv.html)
y la [documentación de Django sobre compilar las bibliotecas GIS](https://docs.djangoproject.com/en/4.1/ref/contrib/gis/install/)

Se realizó la construcción personalizada de las siguientes bibliotecas:

* geos
* SQLite
* proj
* proj-data
* spatialite
* gdal

Puedes revisar `scripts/create_ami.sh` como referencia

Lee la [documentación de AWS sobre crear y usar una AMI personalizada](
https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/using-features.customenv.html)
pero en resumen:

1. En EC2 -> AMIs, identifica la AMI del servidor EC2 de Elastic Beanstalk (Ej: Elige una AMI pública en la que python3.9 esté instalado con Amazon Linux 2).
2. Selecciona la AMI y lanza una nueva instancia basada en ella. 
3. Especifica el nombre de la instancia y elige un par de claves.
4. No olvides configurar en la sección avanzada:
```yaml
#cloud-config
  repo_releasever: repository version number
  repo_upgrade: none
```
1. Conéctate vía SSH a la instancia
2. Instala las dependencias (ver scripts/create_ami.sh)
3. Luego ve a Actions -> Image -> Create Image
4. Cuando esté listo, ve a la Configuración de Instancia de Beanstalk y especifica la referencia AMI de la imagen que acabamos de crear.


---
## ¿Dónde está el código?

Infraestructura y configuración en el repositorio Github
[BLSQ/terraform-iaso-eb](https://github.com/BLSQ/terraform-iaso-eb) Hay buena documentación de Mbayang en la carpeta `docs/`. La visibilidad está restringida.

En el repositorio Github `BLSQ/iaso`:
* `.github` Para la información del flujo de trabajo
* `scripts/`
* `.ebextension` Para los comandos específicos de Elastic beanstalk
* `.platform` Sobrescritura de configuración

---
## Servicios relacionados
* Bucket S3: Para los archivos estáticos y medios subidos por usuarios (en AWS)
* Enketo (en otro AWS Elastic Beanstalk)
* Postgresql RDS (en AWS)
* Servicio de Cola para Worker en segundo plano (en AWS SQS)
* Sentry: manejo de errores y notificaciones (como Saas)
* MailGun (como Saas)
* Route53: redirección DNS (en AWS)

---
Dos tipos de entorno en elastic beanstalk:
* web
* worker

Los vinculamos vía una etiqueta "env" en AWS, para poder desplegarlos al mismo tiempo

Un Entorno Elastic Beanstalk puede contener múltiples "Instancias EC2", que son servidores de máquina virtual. Su número se escala automáticamente según las reglas en elastic beanstalk.
Usualmente tenemos 1 instancia para Worker y 2 para Web.

---
# Bucket S3
* Estático: Empujar estáticos en ellos para que puedan ser adecuadamente cacheados y CDN (no estoy seguro de que realmente hagamos esto)
* Medios: Almacenar medios subidos por los usuarios: Respuesta de formulario (XML), medios adjuntos a respuesta de formulario (fotos), gpkg, definición de formulario, etc.. 

Los estáticos son legibles por todos.

Los medios solo son accesibles vía URL firmada que expira después de un lapso de tiempo (15 minutos creo) y que son generadas al vuelo por iaso cuando se necesita.


 
---
# CI/CD
El despliegue de nuevas versiones se hace vía Github action.

Cada cambio en main se despliega automáticamente en el entorno de staging

El despliegue a otros entornos tiene que ser activado manualmente

---

### Proceso de despliegue 
Cómo se despliega una nueva versión de Iaso

Esta es una vista simplificada, algunos detalles se omiten por claridad

1. Un usuario activa el flujo de trabajo de despliegue en github actions (o se activa automáticamente para staging)
2. En el worker de github: (código en .github/workflows/deploy.yml)
	1. Determinar número de versión. Llamar set_version para configurarlo.
	2. Construye todo el JS/CSS y otros recursos para el front-end
	3. Añadirlos al repositorio git
	4. scripts/eb-deploy.py:
		1. Conectar a la API de AWS para obtener todos los _entornos beanstalk_ para el entorno `iaso`. ej.: `staging` -> `iaso-staging2` y `iaso-staging2-worker`
		2. Para cada entorno beanstalk, activar `eb deploy` (desde awseb cli):
			1. Hacer un archivo zip del contenido del repositorio git (hecho por eb deploy). Incluyendo el asset compilado
			2. Llamar API ElasticBeanstalk para desplegarlo
3. En los servidores Iaso (instancias EC2): Nuestro código/configuración para esto está en el directorio `.ebextensions` Las acciones marcadas con ¥ son parte de la lógica de Elastic beanstalk
	1. El despliegue es activado ¥
	2. La nueva versión de la app es copiada en `/var/app/staging` ¥
	3. Las dependencias en requirements.txt son instaladas ¥
	4. [Nuestra lógica](https://github.com/BLSQ/iaso/blob/main/.ebextensions/50_container_commands.config) es ejecutada
		1. Las traducciones del servidor son compiladas
		2. **El frontend (JS compilado, imagen, css) es empujado al bucket S3.**
		3. **Las migraciones de base de datos son realizadas**
		4. La tabla de caché es creada
	5. `/var/app/staging` es movido a `/var/app/current` ¥
	6. Si estos pasos fallan, Elastic beanstalk hará un *rollback* y revertirá a la versión anterior. Nota: como hacemos manualmente la coincidencia entre worker y web, a veces tenemos el problema de que uno es revertido y el otro no y tenemos un desajuste de versión. A veces también tenemos el problema con migraciones de base de datos incompatibles. ¥
	7. Enviar una notificación de Slack para notificar del éxito o falla del despliegue de github.



---
# Servicios relacionados en más detalle
* Bucket S3: Para los archivos estáticos y medios subidos por usuarios (en AWS)
* Enketo (en otro AWS Elastic Beanstalk)
* Postgresql RDS (en AWS)
* Servicio de Cola para Worker en segundo plano (en AWS SQS)
* Sentry: manejo de errores y notificaciones (como Saas)
* MailGun (como Saas)
* Route53: redirección DNS (en AWS)

---
### Enketo

Desplegado por separado, manejado vía Elastic Beanstalk también, vinculado a Iaso vía variable de entorno. Mbayang maneja esto

---
### AWS SQS
Sistema de cola usado para Worker, ver sección worker en README

---
### Bucket S3
S3 ver arriba


# Arquitectura dentro de la VM
El código está en `/var/app/current`

Systemctl lanza el servidor web como la unidad `web`. Esto se hace vía Gunicorn bajo el usuario web, gunicorn lanza múltiples servidores Django.

Hay un NGINX frente a gunicorn.
Lo anterior es manejado automáticamente vía Iaso

Los logs pueden ser listados dentro de la VM vía `journalctl -u web`

Tenemos 2 crons (por ahora). Se pueden ver usando `systemctl list-timers`