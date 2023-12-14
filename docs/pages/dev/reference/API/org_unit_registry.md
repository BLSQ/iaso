# `OrgUnitChangeRequest` API

"Change Requests" can be submitted for an `OrgUnit` and then reviewed (approved or rejected).

This API allows the DHIS2 Health pyramid to be updated using Iaso.

The Django model that stores "Change Requests" is `OrgUnitChangeRequest`.

# Create or update an `OrgUnitChangeRequest` object - Web + Mobile (IA-2421)

- `POST /api/orgunits/changes/?app_id=…`
- `PUT /api/orgunits/changes/?app_id=…`

## Permissions

- User must be authenticated

## Query parameters

- `app_id`: String - Optional, project for which this is created.

## Body

```json
{
  "uuid": "UUID - Client generated UUID",
  "org_unit_id": "String - id or UUID of the OrgUnit to change",
  "new_parent_id": "String? - id or UUID of the parent OrgUnit, may be null or omitted.",
  "new_name": "String? - Name of the OrgUnit, may be null or omitted.",
  "new_org_unit_type_id": "Int? - id of the OrgUnitType, may be null or omitted",
  "new_groups": "Array of Group ids? - can be empty, null or omitted. Empty means we want to remove all values",
  "new_location": { "": "New geopoint for the OrgUnit, may be null or omitted",
    "latitude": "Double - New latitude of the OrgUnit",
    "longitude": "Double - New longitude of the OrgUnit",
    "altitude": "Double - New altitude of the OrgUnit"
  },
  "new_location_accuracy": "Double - New accuracy of the OrgUnit",
  "new_opening_date": "Timestamp",
  "new_closed_date": "Timestamp",
  "new_reference_instances": "Array of instance ids? - may be null or omitted, cannot be empty"
}
```

## Possible responses

### 201 - Created

### 400 - Bad request

- A not nullable field was null or omitted
- A `String` field has an empty value
- `new_parent_id` is not a valid OrgUnit
- `new_org_unit_type_id` is not a valid OrgUnitType
- One of the `new_groups` id is not a valid Group
- `new_reference_instances` is empty
- `new_reference_instances` only one reference instance can exist by org_unit/form pair
- `new_org_unit_type_id` is not part of the user account
- `new_closed_date` must be later than `new_opening_date`
- `new_parent_id` and `org_unit_id` must have the same version
- `new_parent_id` is already a child of `org_unit_id`

### 401 - Unauthorized

- No authentication token or an invalid one was provided

### 404 - Not found

- one or more of `new_reference_instances` ids is not found
- `new_parent_id` is not found
- `new_org_unit_type_id` is not found




# List `OrgUnitChangeRequest` objects - Web only (IA-2422)

- `GET /api/orgunits/changes/`

## Permissions

- User must be authenticated

## Query parameters

- `page`: Int (optional) - Current page (default: 1)
- `limit`: Int (optional) - Number of entities returned by page (default: 20)
- `org_unit_id`: Int (optional) - Id of the OrgUnit to which the changes apply (default: null)
- `org_unit_type_id`: Int (optional) - Id of the OrgUnitType to filter on, either the current OrgUnitType or in the change (default: null)
- `status`: Array<Enum<Status>> (optional) - One of `new`, `validated`, `rejected` to filter the requests (default: null)
    - can be combined, e.g. `&status=rejected&status=new`
- `parent_id`: Int (optional) - Id of the parent OrgUnit to filter on, either the current parent or in the change (default: null)
- `project`: Int (optional) - Id of the project to filter on.
- `groups`: List of int, comma separated (optional) - Ids of the group to filter on, either the currents groups or in the change (default: null)
    - e.g. `&groups=1847,1846`

## Possible responses

### 200 - OK

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
      "id": "Int - id in the database",
      "uuid": "UUID - uuid in the database",
      "org_unit_id": "Int - id of the OrgUnit",
      "org_unit_uuid": "UUID - uuid of the OrgUnit",
      "org_unit_name": "String - name of the OrgUnit",
      "org_unit_type_id": "Int - id of the current OrgUnitType",
      "org_unit_type_name": "String - name of the current OrgUnitType",
      "status": "Enum<Status> - one of `new`, `validated`, `rejected`",
      "groups": [{
        "id": "Int - id of the Group",
        "name": "String - name of the Group"
      }],
      "requested_fields": "Array<String> - name of the properties that were requested to change",
      "approved_fields": "Array<String>? - name of the properties that were approved to change",
      "rejection_comment": "String? - Comment about why the changes were rejected",
      "created_by": "String - username of creator",
      "created_at": "Timestamp",
      "update_by": "String? - username of updater",
      "updated_at": "Timestamp?"
    }
  ]
}
```

### 400 - Bad request

- `page` or `limit` cannot be parsed to a correct integer value
- One or more of the parameters provided couldn't be parsed
- One or more of the parameters provided couldn't matched to the related resource (E.g.: unknown parent_id)
- A parameter was given that is not recognized

### 401 - Unauthorized

- No authentication token or an invalid one was provided

### 403 - Forbidden

- User doesn't have the proper permission to access this resource.




# List `OrgUnitChangeRequest` objects - Mobile only (IA-2425)

- `GET /api/mobile/orgunits/changes/?app_id=…`

## Permissions

- User must be authenticated

## Query parameter

- `app_id`: String - Must be provided, project for which this is queried.
- `last_sync`: DateString - May be null or omitted. Limits the results to everything that was modified after this DateString
    - `last_sync` filter [is built](https://github.com/carltongibson/django-filter/blob/4a618e080ac904cb9bbcd0066878d3e06014437e/django_filters/filters.py#L289-L300) with [`django.utils.dateparse.parse_datetime`](https://github.com/carltongibson/django-filter/blob/4a618e080ac904cb9bbcd0066878d3e06014437e/django_filters/fields.py#L125C7-L146) and allows:
        - `&last_sync=2023-09-26T17:21:22.921692Z`
        - `&last_sync=2021-09-26T17:21:22Z`
        - `&last_sync=2021-09-26T17:21:22`
        - `&last_sync=2021-09-26T17:21`
- `page`: Int (optional) - Current page (default: 1)
- `limit`: Int (optional) - Number of entities returned by page (default: 20)

## Possible responses

### 200 - OK

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
      "id": "Int - id in the database",
      "uuid": "UUID - uuid in the database",
      "org_unit_id": "Int - id of the OrgUnit",
      "org_unit_uuid": "UUID - uuid of the OrgUnit",
      "status": "Enum<Status> - one of `new`, `validated`, `rejected`",
      "approved_fields": "Array<String>? - name of the properties that were approved to change",
      "rejection_comment": "String? - Comment about why the changes were rejected",
      "created_at": "Timestamp in double",
      "updated_at": "Timestamp in double",
      "new_parent_id": "String? - id or UUID of the parent OrgUnit, may be null or omitted.",
      "new_name": "String? - Name of the OrgUnit, may be null or omitted.",
      "new_org_unit_type_id": "Int? - id of the OrgUnitType, may be null or omitted",
      "new_groups": "Array of Group ids? - can be empty, null or omitted. Empty means we want to remove all values",
      "new_location": { "": "New geopoint for the OrgUnit, may be null or omitted",
        "latitude": "Double - New latitude of the OrgUnit",
        "longitude": "Double - New longitude of the OrgUnit",
        "altitude": "Double - New altitude of the OrgUnit"
      },
      "new_location_accuracy": "Double - New accuracy of the OrgUnit",
      "new_opening_date": "Timestamp in double",
      "new_closed_date": "Timestamp in double",
      "new_reference_instances": "Array of instance ids? - may be null or omitted, cannot be empty"
    }
  ]
}
```

### 400 - Bad request

- `app_id` was not provided
- `page` or `limit` cannot be parsed to a correct integer value
- `last_sync` cannot be parsed to a correct date time.

### 401 - Unauthorized

- No authentication token or an invalid one was provided




# Get an `OrgUnitChangeRequest` object - Web only (IA-2423)

`GET /api/orgunits/changes/{id}/`

## Permissions

- User must be authenticated

## Possible responses

### 200 - OK

```json
{
  "id": "Int - id in the database",
  "uuid": "UUID - uuid in the database",
  "status": "Enum<Status> - one of `new`, `validated`, `rejected`",
  "created_by": "String - username of the user who created that request",
  "created_at": "Timestamp",
  "update_by": "String? - username of the user who accepted/rejected that request",
  "updated_at": "Timestamp?",
  "requested_fields": "Array<String> - name of the properties that were requested to change", 
  "approved_fields": "Array<String>? - name of the properties that were approved to change",
  "rejection_comment": "String? - Comment about why the changes were rejected",
  "org_unit": {
    "id": "Int - id in the database",
    "parent": "String - Name of the parent OrgUnit.",
    "name": "String - Name of the OrgUnit.",
    "org_unit_type_id": "Int - id of the OrgUnitType",
    "org_unit_type_name": "String - Name of the OrgUnitType",
    "groups": [
      {
        "id": "Int - id of the Group",
        "name": "String - name of the Group"
      }
    ],
    "location": { "": "Geopoint for the OrgUnit",
      "latitude": "Double - New latitude of the OrgUnit",
      "longitude": "Double - New longitude of the OrgUnit",
      "altitude": "Double - New altitude of the OrgUnit"
    },
    "opening_date": "Timestamp?",
    "closed_date": "Timestamp?",
    "reference_instances": [ "Array of form objects - can be empty",
      {
        "id": "Int - id in the database",
        "form_id": "id of the form",
        "form_name": "Name of the form",
        "values": [
          {
            "key": "String",
            "label": "String or translated object",
            "value": "String"
          }
        ]
      }
    ]
  },
  "new_parent": "String? - Name of the new parent OrgUnit, may be null or omitted.",
  "new_name": "String? - New name of the OrgUnit, may be null or omitted.",
  "new_org_unit_type_id": "Int? - id of the new OrgUnitType, may be null or omitted",
  "new_org_unit_type_name": "String? - Name of the new OrgUnitType, may be null or omitted",
  "new_groups": [{
    "id": "Int - id of the Group",
    "name": "String - name of the Group"
  }],
  "new_location": { "": "New GeoPoint? for the OrgUnit, may be null or omitted",
    "latitude": "Double - New latitude of the OrgUnit",
    "longitude": "Double - New longitude of the OrgUnit",
    "altitude": "Double - New altitude of the OrgUnit"
  },
  "new_location_accuracy": "Double? - New accuracy of the OrgUnit",
  "new_opening_date": "Timestamp?",
  "new_closed_date": "Timestamp?",
  "new_reference_instances": [ "Array of form objects? - may be null or omitted, cannot be empty",
    {
      "id": "Int - id in the database",
      "form_id": "id of the form",
      "form_name": "Name of the form",
      "values": [
        {
          "key": "String",
          "label": "String or translated object",
          "value": "String"
        }
      ]
    }
  ]
}
```

### 400 - Bad request

- One or more of the parameters provided couldn't be parsed
- One or more of the parameters provided couldn't matched to the related resource (E.g.: unknown parent_id)
- A parameter was given that is not recognized

### 401 - Unauthorized

- No authentication token or an invalid one was provided

### 403 - Forbidden

- User doesn't have the proper permission to access this resource.




# Approve or reject an `OrgUnitChangeRequest` - Web only (IA-2424)

`PATCH /api/orgunits/changes/{id}/`

API to change the status of on change request.

## Permissions

- User must be authenticated
- User must have the `ORG_UNITS_CHANGE_REQUEST_REVIEW` permission

## Body

```json
{
  "status": "Enum<Status> - One of `validated` or `rejected`",
  "approved_fields": "Array<Enum<Field>>? - name of the properties that were approved to change",
  "rejection_comment": "String? - Comment about why the changes were rejected"
}
```

## Possible responses

### 204 - No content

Change were applied successfully

### 400 - Bad request

- `status` of the change to be patched is not `new`
- `status` must be `approved` or `rejected`
- `status` was `validated` but `approved_fields` was null, omitted or empty: at least one `approved_fields` must be provided
- `approved_fields` contains one or more unknown fields
- `status` was `rejected` but `rejection_comment` was null, omitted or empty: a `rejection_comment` must be provided




# List `reference_instances` objects for a given `OrgUnit` - Mobile only (IA-2420)

`GET /api/mobile/orgunits/{id or UUID}/reference_instances?app_id=…`

Returns `Instance` objects marked as `reference_instances` for an `OrgUnit` from newest to oldest.

## Permission

- Same as downloading instances

## Query parameters

- `page`: Int (optional) - Current page (default: 1)
- `limit`: Int (optional) - Number of entities returned by page (default: 20)
- `app_id`: String - project for which this is queried.
- `last_sync`: DateString - May be null or omitted. Limits the results to everything that was modified after this DateString
    - `last_sync` filter [is built](https://github.com/carltongibson/django-filter/blob/4a618e080ac904cb9bbcd0066878d3e06014437e/django_filters/filters.py#L289-L300) with [`django.utils.dateparse.parse_datetime`](https://github.com/carltongibson/django-filter/blob/4a618e080ac904cb9bbcd0066878d3e06014437e/django_filters/fields.py#L125C7-L146) and allows:
        - `&last_sync=2023-09-26T17:21:22.921692Z`
        - `&last_sync=2021-09-26T17:21:22Z`
        - `&last_sync=2021-09-26T17:21:22`
        - `&last_sync=2021-09-26T17:21`

## Possible response

### 200 - OK

```json
{
  "count": "Long",
  "instances": [
    {
        "id": "Int",
        "uuid": "UUID - provided by the client",
        "form_id": "Int",
        "form_version_id": "Int",
        "created_at": "Timestamp in double",
        "updated_at": "Timestamp in double",
        "json":  "JSONObject - contains the key/value of the instance"
    }
  ],
  "has_next": "Boolean",
  "has_previous": "Boolean",
  "page": "Long",
  "pages": "Long",
  "limit": "Long"
}
```

### 400 - Bad request

- `app_id` was not provided
- `page`, `limit` or `version_count` cannot be parsed to a correct integer value
- `last_sync` cannot be parsed to a correct date time.


### 401 - Unauthorized

- No authentication token or an invalid one was provided (if needed)

### 403 - Forbidden

- User doesn't have the proper permission to access this resource (if needed)
