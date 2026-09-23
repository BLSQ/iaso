# Módulos

IASO está organizado según Módulos, que son grupos de funcionalidades que pueden activarse dependiendo del caso de uso a cubrir. Aquí están los Módulos disponibles en IASO:

## Recolección de datos - Formularios

Cree y cargue formularios de recolección de datos utilizando el formato XLS form ampliamente conocido. Los formularios están versionados, así que cada vez que se crea una nueva versión, la anterior permanece disponible en el sistema. Las presentaciones enviadas desde la aplicación móvil pueden validarse desde el web, y la completitud de la recolección de datos puede monitorearse por unidad organizacional, con la posibilidad de explorar los datos para identificar dónde se encuentran los problemas.

## Solicitudes de modificación

Una funcionalidad central del Georegistry que permite mantener actualizados los datos geográficos. Desde la aplicación móvil, los usuarios pueden enviar solicitudes de modificación para una unidad organizacional - incluyendo la creación de una unidad completamente nueva. Una vez enviada, la solicitud aparece en el web para que un responsable la revise, mostrada junto a la versión anterior para poder identificar fácilmente qué ha cambiado.

Qué campos de la unidad organizacional están abiertos a solicitudes de modificación (Nombre, Tipo de unidad organizacional, Padre, Grupo, coordenadas GPS, fechas de apertura y cierre, o si los usuarios pueden crear nuevas unidades organizacionales) es configurable de antemano desde la plataforma web de IASO.

Las solicitudes de modificación también admiten **formularios de referencia**: un formulario XLS específico puede marcarse como formulario de referencia para un tipo de unidad organizacional, permitiendo adjuntar "atributos de datos" totalmente personalizados a las unidades organizacionales - utilizados típicamente para datos como cifras de población o inventario de equipos.

## Completitud por período

Utilizado para esquemas de Financiamiento Basado en el Desempeño (FBD), que IASO también admite como herramienta de recolección de datos.

## Flujo de validación

Habilita la "validación en cascada" de los formularios enviados. Los gestores de datos definen qué roles de usuario son responsables de aprobar los datos en cada nivel de la jerarquía - por ejemplo, el rol "gestor de distrito" aprueba primero, luego "gestor de región", y después "gestor de país". El número de niveles y quién aprueba en cada uno es totalmente configurable para adaptarse a la jerarquía necesaria.

## Entidades

Las entidades son elementos que pueden moverse de una geografía a otra - una persona, una paleta de bienes, o cualquier otro elemento que valga la pena rastrear a lo largo del tiempo. Pueden crearse desde la aplicación móvil y luego gestionarse desde el web.

- Encontrar posibles entidades duplicadas desde la interfaz web y decidir si fusionarlas o no
- Asignar **flujos de trabajo** a tipos de entidades, para que formularios específicos de recolección de datos se abran automáticamente según las respuestas ya dadas

## Almacenamiento externo

Permite que IASO funcione con tarjetas NFC como medio de almacenamiento, permitiendo leer y escribir datos de una entidad en una tarjeta física en el campo.

## Planificación

Mediante una interfaz dinámica basada en mapas, los gestores de datos asignan lugares específicos a usuarios específicos, con un marco temporal definido y uno o más formularios de recolección de datos. Los usuarios de campo ven entonces sus "misiones" asignadas en la aplicación móvil y pueden dirigirse directamente a los puntos donde deben recolectar datos.

## Gestión de inventario

Rastrea las cantidades de artículos disponibles a nivel de unidad organizacional, basándose en preguntas relacionadas con inventario integradas en los formularios de recolección de datos. Cada movimiento "más" o "menos" de un artículo en una unidad organizacional queda registrado, y la aplicación móvil muestra una vista en tiempo real de cuántos artículos quedan en un lugar determinado.

## Pagos

Vinculado a las solicitudes de modificación. Con base en las solicitudes de modificación aprobadas por un responsable, los usuarios pueden generar lotes de pago y descargar un archivo Excel que resume, por usuario, cuántas solicitudes de modificación aprobadas se le deben pagar.

## Form AI

Permite a los usuarios crear o editar formularios de recolección de datos con la IA como asistente, en lugar de construir el formulario XLS manualmente.

## Mapeo con DHIS2

Se activa cuando IASO se utiliza junto con DHIS2, el Sistema de Información de Gestión de Salud de código abierto más utilizado en el mundo. La integración de IASO con DHIS2 es bidireccional: los datos geográficos pueden importarse desde DHIS2, luego las herramientas geoespaciales avanzadas de IASO se encargan de la recolección de datos en el campo, y los datos actualizados se envían de vuelta a DHIS2.

## Enlaces incrustados

Permite a los usuarios incrustar enlaces externos - como paneles de control - directamente en su cuenta de IASO, cada uno con su propia URL personalizada y dedicada. La gestión de usuarios de IASO (por usuario o mediante roles de usuario) controla el acceso a estos enlaces incrustados, que admiten HTML sin procesar, texto simple, iframes y paneles de Superset.
