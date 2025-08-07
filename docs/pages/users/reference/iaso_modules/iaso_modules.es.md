# Módulos

IASO está organizado según Módulos, que son grupos de funcionalidades que pueden agregarse dependiendo del caso de uso a cubrir. Aquí están los Módulos disponibles en IASO:

## Funcionalidades de recolección de datos
- Gestionar formularios de recolección de datos (formularios XLS) y sus envíos de datos relacionados
- Gestionar datos geográficos (importar/exportar datos geo desde Excel, DHIS2 o Geopackages, gestionar las Unidades Organizacionales y su jerarquía)
- Monitorear el proceso de recolección de datos con la tabla de estadísticas de completitud y el mapa
- Gestionar usuarios y sus permisos y geografías, roles de usuario y equipos
- Crear ID(s) de aplicación(es) móvil(es) y gestionar opciones de características relacionadas

## Georegistry 
- Importar varias fuentes de datos desde Excel, DHIS2 o Geopackages, compararlas y fusionarlas según sea necesario
- Visualizar en un mapa dinámico los datos recolectados en los diferentes niveles de la jerarquía (por ejemplo, País, Región, Distrito, establecimiento)
- Validar cambios en Unidades Organizacionales (Nombre, Tipo, coordenadas GPS, fechas de apertura/cierre) enviados desde el campo a través de la aplicación móvil
- Validar datos enviados a través de formularios de recolección de datos que están vinculados a tipos específicos de Unidades Organizacionales, llamados "Formularios de referencia"

## Pagos
- Basado en los cambios propuestos validados por usuario, generar lotes de pago para enviar al proveedor de Mobile Money
- Indicar el estado de los lotes de pagos (pendiente, enviado al proveedor de Mobile Money, etc.)

## Integración bidireccional DHIS2 
- Gestionar los mapeos con elementos de datos de DHIS2 para importación/exportación de datos

## Planificación
- Planificar por adelantado sus actividades de recolección de datos creando una planificación con un marco temporal establecido, geografía, formularios de recolección de datos y equipos
- Asignar tareas de recolección de datos a equipos y usuarios desde la interfaz basada en mapa disponible en la web
- Una vez que las tareas han sido asignadas, los usuarios de aplicación móvil en el campo solo verán los formularios que les han sido asignados

## Entidades
- Las entidades son elementos que pueden moverse de una geografía a otra, por ejemplo una persona, una paleta de bienes, u otros
- Las entidades pueden ser creadas desde la aplicación móvil y luego gestionadas desde la aplicación web
- Encontrar duplicados de entidades usando la interfaz de aplicación web y tomar la decisión de fusionar dos entidades similares o no
- Asignar flujos de trabajo a tipos de entidades, habilitando que formularios específicos de recolección de datos se abran según respuestas previamente dadas