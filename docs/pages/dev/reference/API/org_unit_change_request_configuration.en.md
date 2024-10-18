# `OrgUnitChangeRequestConfiguration` API

This document is a first draft of the `OrgUnitChangeRequestConfiguration` API that was designed by Benjamin in August 2024 and updated by Thibault.
It still needs to be updated and completed, once the developments are over.
 
## 1 - POST /api/orgunits/changes/configs/

API used to create or modify a Change Request configuration.

### Permissions

- Change Request Configuration

### Body

```json
{
  "uuid": "UUID? - OrgUnitChangeRequestConfiguration UUID",
  "project_id": "Int - Project ID",
  "org_unit_type_id": "Int - OrgUnit Type ID",
  "org_units_editable": "Boolean? - Whether or not OrgUnits of this OrgUnit Type are editable",
  "editable_fields": ["Array<String> - List of possible fields"],
  "possible_type_ids": ["Array<Int> - List of possible OrgUnit Type IDs that are allowed as new type for this OrgUnit Type"],
  "possible_parent_type_ids": ["Array<Int> - List of possible OrgUnit Type IDs that are allowed as new parent for this OrgUnit Type"],
  "group_set_ids": ["Array<Int> - List of GroupSet IDs for this OrgUnit Type"],
  "editable_reference_form_ids": ["Array<Int> - List of reference Form ID that can be modified"],
  "other_group_ids": ["Array<Int> - List of possible Group IDs for this OrgUnit Type"]
}
```

### Possible responses

#### 201 - Created

_# Do we return ID/UUID when something is successfully created? Let's try to return it, or even the full OUCRC_

#### 400 - Bad request

- A non-nullable field was null or omitted
- `org_unit_type_id` is not assigned to the given `project_id`
- One or more `editable_fields` value is unknown
- One or more `possible_parent_type_ids` is not a suitable for as a parent for the given OrgUnit Type
- One or more `editable_reference_forms` is not a reference form for the given OrgUnit Type
- `project_id` is not null and doesn't exist
- `org_unit_type_id` is not null and doesn't exist
- One or more `possible_type_ids` don't exist
- One or more `possible_parent_type_ids` don't exist
- One or more `group_set_ids` don't exist
- One or more `editable_reference_form_ids` don't exist
- One or more `other_group_ids` don't exist

#### 401 - Unauthorized

- No authentication token or an invalid one was provided

#### 403 - Forbidden

- User doesn't have the proper permission



## 2 - GET /api/orgunits/changes/configs/

API used to list all Change Request configurations.

### Permissions

- Change Request Configuration

### Query parameters
- page: Int (optional) - Current page (default: 1)
- limit: Int (optional) - Number of entities returned by page (default: 20)
- org_unit_type_id: Int (optional) - ID of the `OrgUnitType` to filter on
- project_id: Int (optional) - ID of the `Project` to filter on

### Possible responses

#### 200 - OK

```json
{
    "count": "Long",
    "has_next": "Boolean",
    "has_previous": "Boolean",
    "page": "Long",
    "pages": "Long",
    "limit": "Long",
    "results": [
        {
            "id": "Int - ID in the database",
            "uuid": "UUID - UUID in the database",
            "project": {
                "id": "Int - Project ID",
                "name": "String - Project name"
            },
            "org_unit_type": {
                "id": "Int - OrgUnit Type ID",
                "name": "String - OrgUnit Type name"
            },
            "org_units_editable": "Boolean - Whether or not OrgUnits of this OrgUnit Type are editable",
            "editable_fields": "Array<String> - List of possible fields",
            "created_at": "Timestamp",
            "created_by": {
                "id": "Int - User ID",
                "username": "String",
                "first_name": "String",
                "last_name": "String"
            },
            "updated_at": "Timestamp",
            "updated_by": {
                "id": "Int - User ID",
                "username": "String",
                "first_name": "String",
                "last_name": "String"
            }
        }
    ]
}
```

#### 400 - Bad request

- One or more parameters provided couldn't be parsed
- One or more parameters provided couldn't be matched with the related resource (_e.g._: unknown `project_id`)
- A given parameter was not recognized

#### 401 - Unauthorized

- No authentication token or an invalid one was provided

#### 403 - Forbidden

- User doesn't have the proper permission to access this resource.


## 3 - GET /api/orgunits/changes/configs/{id}/

API used to fully retrieve a Change Request configuration.

### Permissions

- Change Request Configuration

### Possible responses

#### 200 - OK

```json
{
    "id": "Int - ID in the database",
    "uuid": "UUID - UUID in the database",
    "project": {
        "id": "Int - Project ID",
        "name": "String - Project name"
    },
    "org_unit_type": {
        "id": "Int - OrgUnit Type ID",
        "name": "String - OrgUnit Type name"
    },
    "org_units_editable": "Boolean - Whether or not OrgUnits of this OrgUnit Type are editable",
    "editable_fields": "Array<String> - List of possible fields",
    "possible_types": [
        {
            "id": "Int - OrgUnit Type ID",
            "name": "String - OrgUnit Type name"
        }
    ],
    "possible_parent_types": [
        {
            "id": "Int - OrgUnit Type ID",
            "name": "String - OrgUnit Type name"
        }
    ],
    "group_sets": [
        {
            "id": "Int - GroupSet ID",
            "name": "String - GroupSet name"
        }
    ],
    "editable_reference_forms": [
        {
            "id": "Int - Form ID",
            "name": "String - Form name"
        }
    ],
    "other_groups": [
        {
            "id": "Int - Group ID",
            "name": "String - Group name"
        }
    ],
    "created_at": "Timestamp",
    "created_by": {
        "id": "Int - User ID",
        "username": "String",
        "first_name": "String",
        "last_name": "String"
    },
    "updated_at": "Timestamp",
    "updated_by": {
        "id": "Int - User ID",
        "username": "String",
        "first_name": "String",
        "last_name": "String"
    }
}
```

#### 401 - Unauthorized

- No authentication token or an invalid one was provided

#### 403 - Forbidden

- User doesn't have the proper permission to access this resource.

#### 404 - Not found

- The given ID was not found


## 4 - GET /api/mobile/orgunits/changes/configs/

API used to list all Change Request configurations for the mobile app.

### Permissions

- User must be authenticated

### Query parameters
- app_id: String - Application ID for which to retrieve the configuration
- page: Int (optional) - Current page (default: 1)
- limit: Int (optional) - Number of entities returned by page (default: 20)

### Possible responses

#### 200 - OK

```json
{
  "count": "Long",
  "has_next": "Boolean",
  "has_previous": "Boolean",
  "page": "Long",
  "pages": "Long",
  "limit": "Long",
  "results": [
    {
      "org_unit_type_id": "Int - OrgUnit Type ID",
      "org_units_editable": "Boolean - Whether or not OrgUnits of this OrgUnit Type are editable",
      "editable_fields": ["Array<String> - List of possible fields"],
      "possible_type_ids": ["Array<Int> - List of possible OrgUnit Type IDs that are allowed as new type for this OrgUnit Type"],
      "possible_parent_types": ["Array<Int> - List of possible OrgUnit Type IDs that are allowed as new parent for this OrgUnit Type"],
      "group_sets": ["Array<Int> - List of GroupSet IDs for this OrgUnit Type"],
      "editable_reference_forms": ["Array<Int> - List of reference Form ID that can be modified"],
      "other_groups": ["Array<Int> - List of other Group IDs for this OrgUnit Type"],
      "created_at": "Timestamp",
      "updated_at": "Timestamp"
    }
  ]
}
```

#### 400 - Bad request

- One or more of the parameters provided couldn't be parsed
- One or more of the parameters provided couldn't be matched with the related resource (_e.g._: unknown `project_id`)
- A given parameter was not recognized

#### 401 - Unauthorized

- No authentication token or an invalid one was provided

#### 403 - Forbidden

- User doesn't have the proper permission to access this resource.