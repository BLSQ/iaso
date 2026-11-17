# Formato GeoPackage para datos geográficos

*Cómo preparar un archivo GeoPackage para importar sus unidades organizativas (país, regiones, distritos, establecimientos de salud, aldeas…) en IASO.*

Un **GeoPackage** (`.gpkg`) es un formato estándar de archivo cartográfico, que herramientas
como QGIS pueden abrir y crear. IASO puede importar desde un GeoPackage unidades
organizativas, sus tipos y sus grupos, siempre que el archivo siga la estructura descrita en
esta página.

Puede usarlo para:

- crear su pirámide en una cuenta nueva;
- añadir o actualizar unidades organizativas en una pirámide existente (el archivo puede
  contener solo las unidades que quiere crear o cambiar);
- trasladar una pirámide de una cuenta IASO a otra (exportarla como GeoPackage y luego
  importarla).

!!! tip "Deje el formato en manos de un asistente de IA"
    Preparar este archivo es un trabajo técnico. Puede dar sus archivos (shapefiles,
    GeoJSON, listas Excel…) a un asistente de IA con la dirección de esta página y pedirle que
    genere el GeoPackage. Vea [el mensaje más abajo](#preparar-el-archivo-con-un-asistente-de-ia).

## Estructura del archivo

El archivo contiene:

- **una capa por tipo de unidad organizativa** (una para las regiones, otra para los
  distritos, otra para los establecimientos de salud…);
- **una tabla `groups`**, que puede estar vacía.

### Nombre de las capas

Cada capa se llama `level-{profundidad}-{nombre del tipo}`:

- `profundidad` es el número del nivel, empezando por 1 en la parte superior de la pirámide;
- `nombre del tipo` es el nombre del tipo de unidad organizativa.

Por ejemplo:

| Capa | Contiene |
|---|---|
| `level-1-País` | el país |
| `level-2-Región` | las regiones |
| `level-3-Distrito` | los distritos |
| `level-4-Establecimiento de salud` | los establecimientos de salud |

Si no existe ningún tipo de unidad organizativa con ese nombre, IASO lo crea. Los nombres de
tipo distinguen mayúsculas y minúsculas: para añadir unidades a un tipo existente, use
exactamente la misma ortografía, mayúsculas y acentos. Los tipos de unidades organizativas
son compartidos por todos los proyectos de una cuenta.

### Columnas de cada capa

| Columna | Obligatoria | Contenido |
|---|---|---|
| `ref` | sí | Un identificador único de la unidad, por ejemplo su id de DHIS2 o su código. IASO lo usa para vincular las unidades con su padre y para actualizar la unidad en la siguiente importación. |
| `name` | sí | El nombre de la unidad. |
| `parent_ref` | no | La `ref` de la unidad padre, en el nivel superior. Para vincular una unidad a otra que ya existe en IASO, escriba `iaso:` seguido de su id de IASO, por ejemplo `iaso:1234`. No incluya esta columna en el nivel más alto. |
| `group_refs` | no | Los grupos de la unidad: `ref` de la tabla `groups`, separadas por comas, por ejemplo `urbano,publico`. |
| `opening_date` | no | Fecha de apertura de la unidad, con el formato `AAAA-MM-DD`. |
| `closed_date` | no | Fecha de cierre de la unidad, con el formato `AAAA-MM-DD`. |
| geometría | no | Los límites (polígono) o la ubicación (punto) de la unidad. Una unidad puede no tener geometría. |

`ref` y `name` nunca pueden estar vacíos. Si incluye `parent_ref`, tampoco puede estar
vacía: todas las unidades de la capa deben tener un padre.

Ejemplo de la capa `level-3-Distrito`:

| ref | name | parent_ref | geometría |
|---|---|---|---|
| `DIS_A` | Distrito A | `REG_NORTE` | (polígono) |
| `DIS_B` | Distrito B | `REG_NORTE` | (polígono) |
| `DIS_C` | Distrito C | `REG_SUR` | (polígono) |

### La tabla `groups`

Los grupos permiten clasificar las unidades (por ejemplo *urbano* / *rural*, o *público* /
*privado*). La tabla `groups` no tiene geometría y tiene dos columnas obligatorias:

| Columna | Contenido |
|---|---|
| `ref` | Un identificador único del grupo, usado en la columna `group_refs` de las capas. No puede contener comas. |
| `name` | El nombre del grupo. |

La tabla debe estar presente aunque no use grupos.

Sobre la columna `group_refs`: si una capa no tiene esta columna, los grupos de sus unidades
no se modifican. Si la columna existe pero está vacía para una unidad, esa unidad se quita de
todos sus grupos.

## Errores frecuentes

La importación falla si el archivo contiene:

- una `ref` o un `name` vacíos;
- dos unidades con la misma `ref`;
- una `parent_ref` que no corresponde a ninguna unidad del archivo ni de IASO;
- un grupo en `group_refs` que no está en la tabla `groups` ni en IASO;
- una coma en la `ref` de un grupo;
- una fecha que no está escrita como `AAAA-MM-DD`.

!!! tip "Empiece por una exportación"
    La forma más sencilla de obtener un archivo correcto es partir de uno existente: en
    IASO, una versión de fuente de datos se puede descargar con **Download GeoPackage**. La
    exportación usa el mismo formato, con algunas columnas más (`id`, `uuid`, `parent`,
    `group_names`) que se ignoran si vuelve a importar el archivo.

## Preparar el archivo con un asistente de IA

Dé sus archivos a un asistente de IA (Claude, ChatGPT…) y envíe este mensaje, adaptado a sus
niveles:

> Convierte los archivos adjuntos en un GeoPackage que siga el formato de importación de
> IASO descrito en https://docs.openiaso.com/es/pages/users/reference/geopackage_format.html. Los
> niveles son: [país, región, distrito, establecimiento de salud…]. Comprueba que cada unidad
> tiene una `ref` única y una `parent_ref` que existe en el nivel superior, añade una tabla
> `groups` vacía, y dame el archivo `.gpkg` para descargar.

## Importar el archivo en IASO

1. Vaya a **Admin > Fuentes de datos > Lista de fuentes de datos**.
2. Haga clic en **Versions** en su fuente y luego en **New version from a Geopackage**.
3. Elija su archivo.
4. **Marque "Hacer que el estado de las unidades organizativas sea "Valid"".** Si no, todas
   las unidades se importan con el estado *New* y hay que validarlas una a una antes de
   poder usarlas.
5. Lance la importación. Se ejecuta en segundo plano y puede tardar una decena de minutos:
   sígala en **Admin > Tasks**.
6. Cuando la tarea haya terminado, convierta la nueva versión en la predeterminada: edite
   la fuente de datos, elija el número de la nueva versión en **Versión predeterminada** y
   haga clic en **Guardar**.

Para corregir o completar una pirámide, importe el archivo en la **misma versión** en lugar
de en una nueva: las unidades con la misma `ref` se actualizan en lugar de duplicarse.
