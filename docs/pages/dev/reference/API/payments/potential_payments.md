
# `Potential payment` API

[Mock-ups](https://whimsical.com/supervision-of-the-users-before-payment-9rNU57j31PnFykziJLocbZ)

This API allows to list potential payments linked to multiple `OrgUnitChangeRequest` by the same user to be updated and queried.

The Django model that stores "Potential payment" is `PotentialPayment`.

Whenever the list endpoint is invoked, it evaluates whether a new change request can be incorporated into the potential payment, or if there's a need to generate a new potential payment.

# Get a `PotentialPayment` list

## Permissions

- User must be authenticated
- User needs `iaso_payments` permission


## Query Parameters - Filters

- `page`: Int (optional) - Specifies the current page number. If not provided, the default value is 1.
- `order`: String (optional) - Specifies the order in which the results should be returned. If not provided, the default ordering value is `id`.
- `limit`: Int (optional) - Defines the number of entities to be returned per page. The default value is 20 if not specified.
- `users`: String (optional) - A comma-separated list of User IDs associated with the payments
  - Example: `&user_ids=10,9`
- `user_roles`: String (optional) - A comma-separated list of User Role IDs associated with the payments
  - Example: `&user_role_ids=10,9`
- `parent_id`: Int (optional) - The ID of the parent organization unit linked to the change requests. This should also include child units.
- `change_requests__created_at_after`: Date - 'YYYY-MM-DD' (optional) - The start date for when the change request has been validated. 
- `change_requests__created_at_before`: Date - 'YYYY-MM-DD' (optional) - The end date for when the change request has been validated.


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
    "id": "Int - unique id",
    "change_requests": [
      {
        "id": "Int - change request unique id",
        "org_unit_id": "String - id or UUID of the OrgUnit to change",
        "uuid": "String - change request unique id",
      }
    ],
    "user": {
        "id": "Int - user unique id",
        "username": "String - username of user",
        "first_name": "String - first name of user",
        "last_name": "String - last name of user",
        "telephone": "String? - This type of field should be specified - not implemented yes",
    },
  ]
}
```

### 400 - Bad request

- `page` or `limit` cannot be parsed to a correct integer value

### 401 - Unauthorized

- No authentication token or an invalid one was provided

### 403 - Forbidden

- User doesn't have the proper permission to access this resource.


### 404 - Not found

- `user_id`, `user_role_id`, `org_unit_id` not found










