# Bienvenido a la documentación de IASO

# Introducción a IASO
IASO es una plataforma innovadora, de código abierto, trilingüe (EN/FR/ES) de **recolección de datos con funcionalidades geoespaciales avanzadas** para planificar, monitorear y evaluar programas de salud, ambientales o sociales en países de ingresos bajos y medios (PIBM). IASO es reconocido como un **Bien Público Digital** por la Alianza de Bienes Públicos Digitales y figura entre los software **Global Goods** de Digital Square, testimoniando su utilidad pública.

IASO incluye:

- un **tablero web** - destinado a supervisores para organizar la recolección de datos y la gestión de datos geográficos
- una **aplicación móvil** que también funciona **sin conexión** - destinada a usuarios de campo para completar formularios y enviar datos cuando la red esté disponible
- una **interfaz de correspondencia y script** para analizar, comparar y fusionar múltiples fuentes de datos geográficos
- una **integración bidireccional con DHIS2**, el sistema de información de gestión de salud ampliamente utilizado en los PIBM
  
En términos de funcionalidades, IASO puede resumirse en torno a **cuatro componentes principales** que están interconectados y refuerzan sus capacidades mutuas:

- **Gestión de datos geoespaciales (Georegister)**
    - Gestionar múltiples listas de unidades organizacionales (por ejemplo, zonas de salud, distritos, establecimientos de salud o escuelas) incluyendo sus coordenadas GPS y fronteras
    - Rastrear las modificaciones realizadas a las unidades organizacionales
    - Comparar múltiples fuentes de datos geográficos
    - Proponer modificaciones a las unidades organizacionales desde la aplicación móvil IASO y validarlas en la web
   
- **Recolección de datos geo-estructurados**
    - Crear formularios de recolección de datos utilizando el popular formato XLS e importarlos en IASO
    - Vincular sus formularios a uno o varios tipos de unidades organizacionales (por ejemplo, Nacional/Regional/Distrito/Establecimiento de salud) para estructurar geográficamente su recolección de datos
    - Rastrear los cambios con la gestión de versiones de sus formularios
    - Validar desde la web todas las presentaciones de formularios enviadas por la aplicación móvil IASO
    - Rastrear la completitud de la recolección de datos por nivel de unidades organizacionales e identificar dónde se encuentran los problemas
 
- **Microplanificación**
    - Gestionar equipos de usuarios y equipos de equipos
    - Asignar tareas de recolección de datos a equipos y usuarios utilizando un mapa interactivo
    - Crear calendarios con un perímetro, duración y uno o más formularios de recolección de datos
 
- **Entidades** - estas pueden consistir en individuos (por ejemplo, beneficiarios de programas de salud) u objetos físicos (por ejemplo, lotes de vacunas, mosquiteros, etc.). Los flujos de trabajo permiten rastrear las entidades abriendo formularios específicos en función de las respuestas dadas a formularios anteriores.
    - Crear tipos de entidades (beneficiarios, stocks u otros)
    - Asignar flujos de trabajo a tipos de entidades
    - Registrar entidades a través de la aplicación móvil (sin conexión)
    - Sincronizar las aplicaciones móvil y web
    - Comparar y fusionar entidades si es necesario
    - Registrar los datos de las entidades en una tarjeta NFC
 
La plataforma ha sido implementada en Benín, Burkina Faso, Burundi, Camerún, República Centroafricana, República Democrática del Congo, Haití, Costa de Marfil, Mali, Níger, Nigeria y Uganda. Es el registro geográfico oficial en Burkina Faso desde 2023. IASO también ha sido implementado a nivel regional (región AFRO) para apoyar la Iniciativa Global para la Erradicación de la Polio gracias a sus capacidades de registros geoespaciales y de establecimientos de salud.

# Tecnologías utilizadas
IASO está compuesto por una aplicación Android white labeled utilizando Java/Kotlin, reutilizando una gran parte de los proyectos ODK, y una plataforma web programada en Python/GeoDjango sobre PostGIS. El frontend es principalmente en React/Leaflet. La API está implementada a través de Django Rest Framework, y todos los datos se almacenan en PostgreSQL o el directorio media/. Uno de los objetivos es la facilidad de integración con otras plataformas. Ya tenemos importaciones y exportaciones en formatos CSV y GeoPackage, y apuntamos a una fácil integración con OSM.

La aplicación móvil para Android permite la presentación de formularios y la creación de unidades organizacionales. Los formularios también pueden completarse en una interfaz web a través del servicio complementario Enketo.