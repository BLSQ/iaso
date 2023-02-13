Iaso GeoPackage
========================

GeoPackage (or GPKG) is a file format which can contains multiple layers of geographical information as well
as accompanying non-geographical data.

It is possible to export data from Iaso as GPKG, modify it and then reimport it or to import entirely fresh data. It is
is also possible to export data from Iaso instance and reimport it into another.

Import format
-------------

Iaso allow importing OrgUnit, Group and Type from a [GeoPackage](https://www.geopackage.org/) file (gpkg), as long
as it's formatted according to the specification below.

The general structure is that you will have:
 * One or multiple layers containing the OrgUnits where each layer contains only one type of OrgUnit.
 * One Group table

At import, the file will be linked either to an existing DataSource and version or will create a new DataSource.

When updating an existing source, the gpkg doesn't need to contain the whole source, a subset of the OrgUnit and Group
to update or create is sufficient.

Obviously it must be a valid GeoPackage, conformant with the [OGC specification](https://www.geopackage.org/spec/)

## Layer Tables
The OrgUnit are organized inside GPKG layer(s). Each layer represent a unique OrgUnit type.

These layers must be named in the following ways: `level-{depth}-{type_name}`. Where `depth` is an integer and `type_name` a string.

If a OrgUnitType with such a name does not already exist, it will be created. OrgUnitType are case-sensitive, 
be sure when updating an existing one that the casing and accents matches the targeted OrgUnitType. 

Note that OrgUnit and Group are linked to a particular data source but OrgUnitType are not and are shared between all projects of a tenant.

Each layer table must have the following columns:
* `name` The name of the OrgUnit
* a geometry (can be any name as long as it's referenced as per the GeoPackage spec) [1]
* `ref` Reference to be used for update and linking the parent (will be in orgunit.source_ref). Must be unique.
* `parent_ref` the reference of the parent OrgUnit may be blank or null or the `ref` of the parent (not the name). [2]
* `group_refs` a list of groups reference to which the OrgUnit should belong. Represented as string of ref separated by the ',' character. This column is optional, delete it if you don't want to touch group affiliation. *If you keep it empty all groups will be removed from the OrgUnit when updating*. See Group table below.


[1] It is possible to have OrgUnit without an attached Geometry.

[2] When updating an element from an already existing source, you may want to reference a parent OrgUnit existing in Iaso DataSource. However, this parent OrgUnit may not have a `source_ref` attribute. Instead, you can use the format `iaso#{db_id}` to point to it where `db_id`is the id of the parent OrgUnit in Iaso's database.


## Group table

An additional table `groups` must be present. It represents
the (OrgUnit linked) Groups to create and/or update.  This is an Attribute table in gpkg parlance as it doesn't contain a geometry.

Mandatory columns:
* `ref` Reference to the group, will be in source_ref (used in the layer tables as `group_ref`)
* `name` Name of the Group

Other tables and columns may be present and will be ignored (as long as they don't start with `level-`)

### Problematic input

These input are forbidden:

* `,` in group.ref

## Examples

Some example files are present in the `iaso/tests/fixtures/gpkg` folder.


Export Format
-------------

The export format is the same as the Import format, with the addition of a few columns for convenience.

These columns are considered read only as any modification will be ignored at import.

* `parent` Name of the parent and its type. e.g. `Pujehun (District)`
* `uuid` UUID used by Mobile App at creation
* `group_names` List of group the OrgUnit belong to, separated by `,`. eg  `Case de sante, CS, Rural`
* `id` The id in the iaso DB

OrgUnit without geographical information are also contained in the export.

Note that if a OrgUnit has both a geom (polygon) and a location (point),
the geom will be exported as it take priority.

Contributing
============

Diffing GPKG file
-----------------

To view the difference between GPKG file I recommend the use of sqldiff included with sqlite3.

Example usage:
```
# cd iaso/tests/fixtures
# sqldiff gpkg/minimal_simplified.gpkg gpkg/minimal_simplified_group.gpkg
UPDATE "level-5-FOSA" SET group_refs='group_b, group_a, group_not_in_gpkg' WHERE fid=1;
```

Or with git, to see the different with current commit:
```
git show HEAD:./minimal.gpkg > /tmp/sqldiff.gpkg && sqldiff /tmp/sqldiff.gpkg ./minimal.gpkg
```
