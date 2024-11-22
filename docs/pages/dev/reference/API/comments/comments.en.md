# `Comments Management` API

This document outlines the `Comments Management` API designed to manage comments associated with `OrgUnit` instances, with capabilities to view and manage comments.

## 1 - GET /api/comments/

API used to list all comments associated with `OrgUnit` instances.

### Permissions

- This API requires authentication.

### Query parameters
- object_pk: Int (optional) - Filter by `OrgUnit` primary key.
- parent_object_pk: Int (optional) - Filter by parent `OrgUnit` primary key.
- content_type: String (optional) - Filter by content type, should be `iaso-orgunit`.
- page: Int (optional) - Current page (default: 1).
- limit: Int (optional) - Number of entities returned per page (default: 20).
- status: String (optional) - Filter by comment status (e.g., 'new', 'in-progress', 'treated').
- order: String (optional) - Sort results by a specific field. Possible values: `org_unit_name`, `user_name`, `status`, `submit_date`.

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
            "id": "Int - Unique identifier for the comment",
            "user": {
                "id": "String - Unique identifier for the user",
                "first_name": "String - First name of the user",
                "user_name": "String - Username of the user",
                "last_name": "String - Last name of the user"
            },
            "object": {
                "id": "Int - Primary key of the associated Object (here OrgUnit)",
                "label": "String - Label of the associated Object (here OrgUnit name)"
            },
            "content_type": "String - Content type, should be 'iaso-orgunit'",
            "site": "String - Site where the comment was made",
            "submit_date": "DateTime - Date and time when the comment was submitted",
            "parent": "Int - ID of the parent comment if this is a reply",
            "children": "Array - List of child comments",
            "status": "String - Status of the comment (e.g., 'new', 'in-progress', 'treated')"
        }
    ]
}
```

## 2 - PATCH /api/comments/{id}/

API used to update the status of an existing comment.

### Permissions

- This API requires authentication and appropriate permissions to update the comment.

### Request body

```json
{
    "status": "String - New status of the comment (e.g., 'new', 'in-progress', 'treated')"
}
```

### Possible responses

#### 200 - OK

```json
{
    "id": "Int - Unique identifier for the updated comment",
    "status": "String - Updated status of the comment"
}
```

#### 400 - Bad Request

- Invalid status value or missing required fields.

#### 403 - Forbidden

- User does not have permission to update the comment.

#### 404 - Not Found

- Comment with the specified ID does not exist.
