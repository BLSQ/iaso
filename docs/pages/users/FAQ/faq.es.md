# FAQ

### ¿Cómo configuro Iaso de manera que los usuarios móviles no puedan crear nuevas UO? Y/o ¿es posible limitar la creación de UO a ciertos tipos de UO? Ej: los usuarios móviles pueden crear los tipos en la parte inferior de la jerarquía (FOSA, villa), pero no en la parte superior (Región -> Área sanitaria)?

Está en la configuración del tipo de unidad organizacional: especificas qué está permitido bajo un tipo de unidad organizacional dado en el selector "sub tipos de unidad organizacional".

![CleanShot 2022-12-07 at 10 18 16](https://user-images.githubusercontent.com/185797/206139597-f9b1c7e4-3bca-422e-a89b-337bed9d48e4.png)

### ¿Cómo configurar un ETL de IASO?

[Extract, Transform, Load (ETL)](https://en.wikipedia.org/wiki/Extract,_transform,_load) es un script para extraer y transformar los datos de entidades de IASO al formato esperado por los dashboards de Tableau.

Actualmente, lee y escribe en la misma base de datos que la instalación de Iaso. El script ETL se puede utilizar de dos maneras:

1. Se puede programar como una tarea periódica, lo que significa que se ejecuta de forma regular.
2. Alternativamente, se puede programar como una tarea única, donde la tarea se ejecuta solo una vez.

#### Cómo ver las tareas periódicas programadas

Desde la página de Administración de Iaso, en la sección "Periodic Tasks" seleccione "Periodic tasks":

![Periodic tasks section](./faq_attachments/Periodic-Tasks.png)

Obtendrá una lista de tareas programadas:

![Periodic tasks List](./faq_attachments/Periodic-task-List.png)

#### Cómo crear una tarea ETL como tarea periódica

Desde la página de Administración de Iaso, en la lista "Periodic Tasks", en la parte superior derecha, hay un botón **Add periodical task**:

![Add periodical task Button](./faq_attachments/Add-periodical-task-Button.png)

Obtendrá un formulario para crear/editar una tarea periódica como la tarea ETL:

![Period task forms](./faq_attachments/Periodic-task-Iaso-Form.png)

Hay 5 campos principales:

- Name: el nombre de la tarea
- Task (custom): un script personalizado desarrollado
- Enabled: si está en true, la tarea se ejecutará automáticamente
- Interval Schedule: la frecuencia de ejecución de la tarea (cuando Enabled está en True)
- One-off Task: si está marcado, la tarea programada se ejecutará una sola vez

Luego haga clic en **Save** para guardar la tarea.

En la lista de tareas periódicas, cuando **Enabled** y/o **One-off Task** está en true, el icono circular se pondrá verde; de lo contrario, será rojo.

#### Cómo ejecutar el script ETL manualmente

Desde la página "Periodic tasks" en la Administración de Iaso, seleccione la tarea ETL a ejecutar; en el campo "Action" de arriba, seleccione la acción "Run Selected Tasks":

![Run Period task](./faq_attachments/Select-periodic-task-to-run.png)

Luego haga clic en el botón **Go**:

![Run ETL Period task](./faq_attachments/Run-periodic-task.png)

Tenga en cuenta que la cola de tareas es gestionada por Celery, que es una cola de tareas distribuida.

Una vez que la tarea haya terminado de ejecutarse, puede ir a la sección "Celery Results" y abrir "Task results". Allí encontrará una lista de tareas completadas ordenadas por fecha y hora de finalización, con para cada fila:

1. Period task name: el nombre de la tarea
2. Task Name: el script personalizado desarrollado
3. Completed datetime: la hora en que el script terminó de ejecutarse
4. Task state: **SUCCESS** si la tarea se ejecutó correctamente, **FAILURE** si falló

![Task results](./faq_attachments/Task-results-list.png)

Cuando la tarea se ejecute correctamente, poblará la tabla de analíticas con los datos de las entidades.
En la página de Administración de Iaso, puede encontrar todas las tablas de analíticas en la sección WFP:

1. Beneficiaries
2. Journeys
3. Visits
4. Steps
5. Monthly statistics

Tenga en cuenta que, en nuestro caso, hay 2 tipos de beneficiarios: **Children under 5** y **Pregnant and Lactating Women** (PLW)

##### 1. Beneficiaries

Una tabla de analíticas para almacenar la información básica del beneficiario:

- Birth date: la fecha de nacimiento del beneficiario registrada en la visita de admisión
- Gender: el género del beneficiario, usado solo para niños menores de 5 años
- Entity id: referencia al id de la entidad
- Account: referencia a la cuenta del país

![Beneficiary](./faq_attachments/Beneficiary.png)

##### 2. Journeys

Tabla de analíticas para almacenar la información del beneficiario desde la admisión en el programa hasta la salida. Cuando un beneficiario es admitido en un programa, significa en el contexto actual el inicio de un recorrido (journey) que terminará cuando sea dado de alta del programa.

- Beneficiary: referencia al id del beneficiario
- Admission Criteria: el criterio seleccionado en la visita de admisión, ej: MUAC, WHZ
- Admission Type: el tipo de admisión seleccionado en la visita de admisión. ej: New Case, Relapse, etc.
- Nutrion Programme: el programa seleccionado en la visita de admisión. ej: OTP, TSFP
- Programme Type: indica si el beneficiario es un niño menor de 5 años o una mujer embarazada/lactante, ej: U5, PLW
- Initial Weight: el peso del beneficiario al ser admitido en el programa
- Discharge Weight: el peso del beneficiario al ser dado de alta del programa
- Start Date: la fecha de admisión
- End Date: la fecha de alta
- Duration: la duración de la estancia (número de días entre la fecha de admisión y la fecha de alta), es decir, la duración del recorrido
- Weight Gain: la diferencia entre el peso de alta y el peso inicial cuando es positiva
- Weight Loss: la diferencia entre el peso de alta y el peso inicial cuando es negativa
- Exit Type: el motivo del alta del programa. ej: Cured, Voluntary Withdrawal, Death, Defaulter, etc.
- Instance Id: referencia al envío del formulario de registro del beneficiario

![Journey](./faq_attachments/Journey.png)

##### 3. Visits

Tabla de analíticas para almacenar la información de las visitas del beneficiario. Por ejemplo, en un programa de nutrición, hay 2 tipos de visitas:

1. admission: la primera vez que el beneficiario es admitido en el programa
2. followup: las visitas sucesivas cuando el beneficiario ya está admitido en el programa

Estos son los campos de la tabla:

- Date: fecha de la visita de admisión o de seguimiento
- Number: el número de la visita actual (la visita de admisión es 0)
- Org unit: la unidad organizacional donde ocurrió la visita
- Journey: referencia al id del recorrido al que pertenece la visita

![Visit](./faq_attachments/Visits.png)

##### 4. Steps

En el contexto de un programa de nutrición, una visita se divide en 3 pasos: antropométrico, médico y de asistencia.

Estos son los campos de la tabla:

- Assistance type: el tipo de asistencia dado durante la visita médica o de asistencia. ej: Amoxillin, Soap, Net, CSB, etc.
- Quantity given: la cantidad dada para el tipo de asistencia.
- Visit: referencia a la visita vinculada

![Steps](./faq_attachments/Steps.png)

Para cada tabla de analíticas, encontrará filtros a la derecha que permiten filtrar los datos por varios valores de campo.

##### 5. Monthly statistics

Una tabla de analíticas para agregar los datos de asistencia dentro de las visitas según la unidad organizacional donde ocurrieron las visitas, el período (mes y año) y el tipo y cantidad de asistencia dada.

Por ejemplo, cuando hay 3 visitas de 3 beneficiarios que pertenecen al mismo tipo de programa, programa de nutrición, tipo de admisión y criterio de admisión, que ocurrieron en la misma unidad organizacional, mes y año, y dentro de las visitas se han dado varias asistencias, en esta tabla esas 3 visitas se agregarán en 1 sumando las cantidades de asistencia dadas para el mismo tipo de asistencia.

Estos son los campos de la tabla:

1. Org Unit: la referencia de la unidad organizacional donde ocurrieron las visitas
2. Account: referencia a la cuenta del país
3. Month: el mes en que ocurrieron las visitas
4. Year: el año en que ocurrieron las visitas
5. Admission criteria: el criterio de admisión de todas las visitas agregadas
6. Admission type: el tipo de admisión de todas las visitas agregadas
7. Nutrition program: el programa de nutrición de todas las visitas agregadas
8. Program type: el tipo de programa de todas las visitas agregadas
9. Number visits: el número de visitas agregadas
10. Given sachet RUSF: la suma de toda la cantidad dada de RUSF (tipo de asistencia) durante las visitas de asistencia
11. Given sachet RUTF: la suma de toda la cantidad dada de RUTF (tipo de asistencia) durante las visitas de asistencia
12. Given quantity CSB: la suma de todo el CSB dado durante el tipo de asistencia

![Monthly Statistics](./faq_attachments/Monthly-statistics.png)

Tenga en cuenta que a la derecha hay un filtro que permite filtrar los datos por varios valores de campo.
