
# `PaymentStatus` API

[Mock-ups](https://whimsical.com/supervision-of-the-users-before-payment-9rNU57j31PnFykziJLocbZ)

This API allows the status of payments linked to multiple `OrgUnitChangeRequest` by the same user to be updated and queried.

The Django model that stores "Payment Status" is `PaymentStatus`.


The `PaymentStatus` model has a `status` field which can have one of the following values:

- `PENDING`: This is the default status. It indicates that the payment is yet to be processed.
- `SENT`: This status indicates that the payment has been processed and sent.
- `REJECTED`: This status indicates that the payment was not successful and has been rejected.

These statuses are stored as a list of tuples in the `STATUS_CHOICES` field.

# Get a `PaymentStatus` list

## Permissions

- User must be authenticated
- User needs `iaso_payments` permission


## Query Parameters - Filters

- `page`: Int (optional) - Specifies the current page number. If not provided, the default value is 1.
- `order`: String (optional) - Specifies the order in which the results should be returned. If not provided, the default ordering value is `id`.
- `limit`: Int (optional) - Defines the number of entities to be returned per page. The default value is 20 if not specified.
- `user_ids`: String (optional) - A comma-separated list of User IDs associated with the payments
  - Example: `&user_ids=10,9`
- `user_role_ids`: String (optional) - A comma-separated list of User Role IDs associated with the payments
  - Example: `&user_role_ids=10,9`
- `org_unit_id`: Int (optional) - The ID of the parent organization unit linked to the change requests. This should also include child units.
- `from_date`: Date - 'YYYY-MM-DD' (optional) - The start date for when the change request has been validated. 
- `to_date`: Date - 'YYYY-MM-DD' (optional) - The end date for when the change request has been validated.


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
    "status": "String - PENDING or SENT or REJECTED",
    "change_requests": [
      {
        "id": "Int - change request unique id",
        "org_unit_id": "String - id or UUID of the OrgUnit to change",
      }
    ],
    "created_by": {
      "id": "Int - id of the User who created that payment",
      "username": "String - username of user",
      "first_name": "String - first name of user",
      "last_name": "String - last name of user",
    },
    "created_at": "Timestamp",
    "updated_by": {
      "id": "Int - id of the User who updated that payment",
      "username": "String - username of user",
      "first_name": "String - first name of user",
      "last_name": "String - last name of user",
    },
    "updated_at": "Timestamp",
    "user": {
        "id": "Int - user unique id",
        "username": "String - username of user",
        "first_name": "String - first name of user",
        "last_name": "String - last name of user",
        "user_role_id": "Int - user role id if one",
        "user_role_name": "String - user role name if one",
        "telephone": "String? - This type of field should be specified",
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


### 404 - Forbidden

- payment not fount
- `user_id`, `user_role_id`, `org_unit_id` not found



# Remarks

1. Who creates the payments? Typically, a payment is created when a user initiates a transaction. This could be done automatically when a change request is made or manually by an admin user. The creation of a payment could be triggered in the backend code where the change request is processed.

2. Marking change requests as paid: We could add a payment_status field to the OrgUnitChangeRequest model. This field would reference the PaymentStatus of the associated payment. When a payment is processed, We can update this field accordingly.







