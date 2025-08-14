# Conceptos

## Cuestionarios o formularios de recolección de datos XLS

Lo que viene con la recolección de datos son preguntas, y para organizar estas preguntas, **formularios de recolección de datos**. Estos son básicamente listas de las preguntas para las cuales uno quisiera recopilar respuestas, mientras especifica opciones (obligatorio o no, saltar una pregunta dependiendo de la respuesta anterior, etc.).
IASO se basa en [formularios XLS](https://xlsform.org/en/) para sus cuestionarios, que por lo tanto se predefinen usando un archivo Excel.

En IASO, los formularios de recolección de datos están **versionados**, lo que significa que cada vez que se crea una nueva versión, la versión anterior se mantiene y está disponible en el sistema.

## Unidades Organizacionales
IASO usa la noción de **Unidades Organizacionales (Unidad org o UO)** para gestionar datos geográficos.
Los **tipos de unidades organizacionales (TUO)** representan niveles en la jerarquía

Ejemplo:

- País

- Región
- Distrito
- Área
- Instalación/Villa/Punto de Interés

Las unidades organizacionales se clasifican en la pirámide según un padre y uno o varios hijos (excepto el/los padre(s) superior(es) y el/los hijo(s) más bajo(s)).
Ejemplo a continuación:

- República Democrática del Congo (Tipo de unidad org "País") es la unidad org padre de

- Kinshasa (Tipo de unidad org "Ciudad"), que es la unidad org padre de
- Oficina Bluesquare (Tipo de unidad org "Oficina")


La recolección de datos en IASO está estructurada según la jerarquía definida, y cualquier usuario necesita seleccionar explícitamente una unidad organizacional antes de proceder a abrir el cuestionario y responder preguntas. De esta manera, uno se asegura de que los datos recolectados estén correctamente asociados con la geografía relevante.

## Proyectos
En IASO, un Proyecto es una instancia de aplicación móvil, con su propio ID de App. Dentro de una cuenta, puedes tener uno o varios Proyecto(s) con diferentes opción(es) de características.
Los usuarios pueden estar vinculados a uno o varios Proyecto(s).

Bueno saber:

- Un Proyecto está vinculado a una fuente de datos

- Un Proyecto puede estar vinculado a uno o varios usuarios
- Algunos usuarios pueden estar limitados a uno o varios Proyecto(s)/ID(s) de App - puedes definir esto en la parte de gestión de Usuarios
- Cada Tipo de Unidad Org tiene que estar vinculado a uno o varios Proyecto(s)
- Cada Formulario tiene que estar vinculado a uno o varios Proyecto(s)

## Entidades
En IASO, una "**Entidad**" es cualquier cosa que puede moverse o ser movida y que queremos rastrear a través del tiempo y Unidades Org. Por ejemplo, una persona, un carro, un paquete, etc.

Para diferenciar entre diferentes tipos de entidades, IASO tiene un concepto de "**Tipo de Entidad**".

Una entidad está representada por una presentación a un [formulario](#Cuestionarios-o-formularios-de-recolección-de-datos-XLS). Esta presentación se refiere como el **perfil**.
El tipo de entidad define qué formulario tiene que ser llenado para crear una nueva entidad.

### Flujos de trabajo
Basado en el perfil de la entidad, es posible ofrecer diferentes tipos de formularios para llenar y cómo cada nueva presentación impacta el perfil.
Las reglas que definen qué formularios y cómo cada presentación impacta el perfil se llaman un "**Flujo de trabajo**".