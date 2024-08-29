# `OrgUnitChangeRequestConfiguration` API

This document is a first draft of the `OrgUnitChangeRequest` API that was designed by Benjamin in August 2024 and updated by Thibault.
It still needs to be updated and completed, once the developments are over.
 
## 1 - POST /api/change_requests_configs/

API used to create or modify a Change Request configuration.

### Permissions

- Change Request Configuration

### Body

```json
{
  "project_id": "Int - Project ID",
  "org_unit_type_id": "Int - OrgUnit Type ID",
  "org_units_editable": "Boolean - Whether or not OrgUnits of this OrgUnit Type are editable",
  "editable_fields": ["Array<String> - List of possible fields"],
  "possible_parent_type_ids": ["Array<Int> - List of possible OrgUnit Type IDs that are allowed as new parent for this OrgUnit Type"],
  "possible_group_set_ids": ["Array<Int> - List of possible GroupSet IDs for this OrgUnit Type"],
  "editable_reference_form_ids": ["Array<Int> - List of reference Form ID that can be modified"]
}
```

### Possible responses

#### 201 - Created

#### 400 - Bad request

- A not nullable field was null or omitted
- `org_unit_type_id` is not assigned to the given `project_id`
- One or more `editable_fields` value is unknown
- One or more `possible_parent_type_ids` is not a suitable for as a prent for the given OrgUnit Type
- One or more `editable_reference_form_ids` is not a reference form for the given OrgUnit Type

#### 401 - Unauthorized

- No authentication token or an invalid one was provided

#### 403 - Forbidden

- User doesn't have the proper permission

#### 404 - Not found

- `project_id` is not null and doesn't exist
- `org_unit_type_id` is not null and doesn't exist
- One or more `possible_parent_type_ids` doesn't exist
- One or more `possible_group_set_ids` doesn't exist
- One or more `editable_reference_form_ids` doesn't exist


## 2 - GET /api/change_requests_configs/

API used to list all Change Request configurations.

### Permissions

- Change Request Configuration

### Query parameters
- page: Int (optional) - Current page (default: 1)
- limit: Int (optional) - Number of entities returned by page (default: 20)
- org_unit_type_id: Int (optional) - Id of the OrgUnitType to filter on
- project_id: Int (optional) - Id of the Project to filter on

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
      "id": "Int - id in the database, I know Martin wants it",
      "project_id": "Int - Project ID",
      "project_name": "String - Project name",
      "org_units_editable": "Boolean - Whether or not OrgUnits of this OrgUnit Type are editable",
      "org_unit_type_id": "Int - OrgUnit Type ID",
      "org_unit_type_name": "String - OrgUnit Type name",
      "editable_fields": "Array<String> - List of possible fields",
      "possible_parent_type": [
        {
        "id": "Int - OrgUnit Type ID",
        "name": "String - OrgUnit Type name"
        }
      ],
      "possible_group_set_ids": [
        {
          "id": "Int - Group ID",
          "name": "String - Group name"
        }
      ],
      "editable_reference_form_ids": [
        {
          "id": "Int - Form ID",
          "name": "String - Form name"
        }
      ],
      "created_at": "Timestamp",
      "updated_at": "Timestamp"
    }
  ]
}
```

#### 400 - Bad request

- One or more of the parameters provided couldn't be parsed
- One or more of the parameters provided couldn't matched to the related resource (E.g.: unknown project_id)
- A parameter was given that is not recognized

#### 401 - Unauthorized

- No authentication token or an invalid one was provided

#### 403 - Forbidden

- User doesn't have the proper permission to access this resource.



## 3 - GET /api/change_requests_configs/{id}/

API used to retrieve a Change Request configuration.

### Permissions

- Change Request Configuration

### Possible responses

#### 200 - OK

```json
{
  "id": "Int - id in the database, I know Martin wants it",
  "project_id": "Int - Project ID",
  "project_name": "String - Project name",
  "org_unit_type_id": "Int - OrgUnit Type ID",
  "org_unit_type_name": "String - OrgUnit Type name",
  "org_units_editable": "Boolean - Whether or not OrgUnits of this OrgUnit Type are editable",
  "editable_fields": ["Array<String> - List of possible fields"],
  "possible_parent_type": [
    {
    "id": "Int - OrgUnit Type ID",
    "name": "String - OrgUnit Type name"
    }
  ],
  "possible_group_set_ids": [
    {
      "id": "Int - Group ID",
      "name": "String - GroupSet name"
    }
  ],
  "editable_reference_form_ids": [
    {
      "id": "Int - Form ID",
      "name": "String - Form name"
    }
  ],
  "created_at": "Timestamp",
  "updated_at": "Timestamp"
}
```

#### 401 - Unauthorized

- No authentication token or an invalid one was provided

#### 403 - Forbidden

- User doesn't have the proper permission to access this resource.

#### 404 - Not found

- The given ID was not found


## 4 - GET /api/mobile/change_requests_configs/

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
      "possible_parent_type_ids": ["Array<Int> - List of possible OrgUnit Type IDs that are allowed as new parent for this OrgUnit Type"],
      "possible_group_set_ids": ["Array<Int> - List of possible GroupSet IDs for this OrgUnit Type"],
      "editable_reference_form_ids": ["Array<Int> - List of reference Form ID that can be modified"]
    }
  ]
}
```

#### 400 - Bad request

- One or more of the parameters provided couldn't be parsed
- One or more of the parameters provided couldn't matched to the related resource (E.g.: unknown project_id)
- A parameter was given that is not recognized

#### 401 - Unauthorized

- No authentication token or an invalid one was provided

#### 403 - Forbidden

- User doesn't have the proper permission to access this resource.