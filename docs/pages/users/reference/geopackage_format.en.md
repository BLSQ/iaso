# GeoPackage format for geographic data

*How to prepare a GeoPackage file to import your organisation units (country, regions, districts, health facilities, villages…) into IASO.*

A **GeoPackage** (`.gpkg`) is a standard file format for map data, which tools such as QGIS
can open and create. IASO can import organisation units, their types and their groups from
a GeoPackage, as long as the file follows the structure described on this page.

You can use it to:

- create your pyramid in a new account;
- add or update organisation units in an existing pyramid (the file can contain only the
  units you want to create or change);
- move a pyramid from one IASO account to another (export it as a GeoPackage, then import it).

!!! tip "Let an AI assistant do the formatting"
    Preparing this file is technical work. You can give your files (shapefiles, GeoJSON,
    Excel lists…) to an AI assistant with this page's address and ask it to produce the
    GeoPackage for you. See [the prompt below](#prepare-the-file-with-an-ai-assistant).

## Structure of the file

The file contains:

- **one layer per organisation unit type** (one for regions, one for districts, one for
  health facilities…);
- **one `groups` table**, which can be empty.

### Layer names

Each layer is named `level-{depth}-{type name}`:

- `depth` is the level number, starting from 1 at the top of the pyramid;
- `type name` is the name of the organisation unit type.

For example:

| Layer | Contains |
|---|---|
| `level-1-Country` | the country |
| `level-2-Region` | the regions |
| `level-3-District` | the districts |
| `level-4-Health facility` | the health facilities |

If an organisation unit type with this name doesn't exist yet, IASO creates it. Type names
are case-sensitive: to add units to an existing type, use exactly the same spelling, capitals
and accents. Organisation unit types are shared by all the projects of an account.

### Columns of each layer

| Column | Required | Content |
|---|---|---|
| `ref` | yes | A unique identifier for the unit, for example its DHIS2 id or its code. IASO uses it to link units to their parent and to update the unit at the next import. |
| `name` | yes | The name of the unit. |
| `parent_ref` | no | The `ref` of the parent unit, in the level above. To attach a unit to a unit already in IASO, write `iaso:` followed by its IASO id, for example `iaso:1234`. Leave the column out for the top level. |
| `group_refs` | no | The groups of the unit: `ref`s from the `groups` table, separated by commas, for example `urban,public`. |
| `opening_date` | no | Date the unit opens, as `YYYY-MM-DD`. |
| `closed_date` | no | Date the unit closes, as `YYYY-MM-DD`. |
| geometry | no | The boundary (polygon) or the location (point) of the unit. A unit can have no geometry. |

`ref` and `name` can never be empty. If you include `parent_ref`, it can't be empty either:
every unit in that layer must have a parent.

Example of the `level-3-District` layer:

| ref | name | parent_ref | geometry |
|---|---|---|---|
| `DIS_A` | District A | `REG_NORTH` | (polygon) |
| `DIS_B` | District B | `REG_NORTH` | (polygon) |
| `DIS_C` | District C | `REG_SOUTH` | (polygon) |

### The `groups` table

Groups let you classify units (for example *urban* / *rural*, or *public* / *private*). The
`groups` table has no geometry and has two required columns:

| Column | Content |
|---|---|
| `ref` | A unique identifier for the group, used in the `group_refs` column of the layers. It can't contain a comma. |
| `name` | The name of the group. |

The table must be present even if you don't use groups.

About the `group_refs` column: if a layer doesn't have this column, the groups of its units
are not changed. If the column is there but empty for a unit, that unit is removed from all
its groups.

## Common errors

The import fails if the file contains:

- an empty `ref` or `name`;
- two units with the same `ref`;
- a `parent_ref` that matches no unit in the file or in IASO;
- a group in `group_refs` that is not in the `groups` table or in IASO;
- a comma in a group `ref`;
- a date that is not written `YYYY-MM-DD`.

!!! tip "Start from an export"
    The easiest way to get a correct file is to start from one: in IASO, a data source
    version can be downloaded with **Download GeoPackage**. The export uses the same format,
    with a few extra columns (`id`, `uuid`, `parent`, `group_names`) that are ignored when you
    import the file again.

## Prepare the file with an AI assistant

Give your files to an AI assistant (Claude, ChatGPT…) and send this message, adapted to
your levels:

> Convert the attached files into a GeoPackage that follows the IASO import format described
> at https://docs.openiaso.com/pages/users/reference/geopackage_format.html. The levels are:
> [country, region, district, health facility…]. Check that every unit has a unique `ref` and
> a `parent_ref` that exists in the level above, add an empty `groups` table, and give me the
> `.gpkg` file to download.

## Import the file into IASO

1. Go to **Admin > Data Sources > Data Sources list**.
2. Click **Versions** on your data source, then **New version from a Geopackage**.
3. Choose your file.
4. **Tick "Switch org units status to "Valid"".** Otherwise all the units are imported with
   the status *New* and have to be validated one by one before they can be used.
5. Launch the import. It runs in the background and can take a dozen minutes: follow it in
   **Admin > Tasks**.
6. When the task is finished, make the new version the default one: edit the data source,
   choose the new version number under **Default version**, then **Save**.

To correct or complete a pyramid, import the file into the **same version** rather than a
new one: the units with the same `ref` are updated instead of being duplicated.
