GeoPackage Import Format
========================

Iaso allow importing OrgUnit, Group and Type from a [GeoPackage](https://www.geopackage.org/) file (gpkg), as long
as it's formatted according to the specification below.

The general structure is that you will have:
 * layers containing the OrgUnits, one layer by type
 * a Group table

The file will be linked at import to a DataSource and a particular version of it. Either existing one or new.

When updating an existing source, the gpkg doesn't need to contain the whole source, a subset of the OrgUnit and Group
to update or create is sufficient.

Obviously it must be a valid GeoPackage, conformant with the [OGC specification](https://www.geopackage.org/spec/)

## Layer Tables
The OrgUnit are organized in layer, each layer represent a different OrgUnit types.

These layers must be named in the following ways: `level-{depth}-{type_name}`

If a OrgUnitType with such a name don't exist then it will be created. Note that OrgUnit and Group are linked to a
particular data source but OrgUnitType are not and are shared between all tenants.

Each layer table must have the following columns:
* `name` The name of the OrgUnit
* a geometry (can be any name as long as it's referenced as per the GeoPackage spec) [1]
* `ref` Reference to be used for update and linking the parent (will be in orgunit.source_ref)
* `parent_ref` the reference of the parent OrgUnit may be blank or null. [2]
* `group_refs` a list of groups reference to which the OrgUnit should  belong. This column is optional, delete it if you don't want to touch the group, if you keep it empty the OrgUnit will be removed from all group when updating. See Group table below

[1] When updating a source and reference to a parent already existing in Iaso but don't have a source_ref, you can use the format `iaso#{db_id}` to point to it.

[2] It is possible to have OrgUnit without an attached Geometry.

## Group table

An additional table `groups`  must be present, it represents
the (OrgUnit) Groups to create or update.  This is an Attribute table in gpkg parlance as it doesn't contain a geom.

Mandatory columns:
* `ref` Reference will be in source_ref
* `name` Name of the OrgUnit

Other tables and columns may be present and will be ignored (as long as they don't start with `level-`)

# Examples

Some example files are present in the `iaso/tests/fixtures/gpkg` folder.
