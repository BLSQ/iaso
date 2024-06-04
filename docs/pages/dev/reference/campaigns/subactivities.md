# SubActivity and SubActivityScope Models and APIs

## Models

### SubActivity

The `SubActivity` model represents a sub-activity within a round of a campaign. It has the following fields:

-   `round`: A foreign key to the `Round` model, representing the round to which the sub-activity belongs.
-   `name`: A string field representing the name of the sub-activity.
-   `age_unit`: A choice field representing the unit of age targeted by the sub-activity. The choices are "Months" and "Years".
-   `age_min`: An integer field representing the minimum age targeted by the sub-activity.
-   `age_max`: An integer field representing the maximum age targeted by the sub-activity.
-   `start_date`: A date field representing the start date of the sub-activity.
-   `end_date`: A date field representing the end date of the sub-activity.

### SubActivityScope

The `SubActivityScope` model represents the scope of a sub-activity, including the selection of an organizational unit and the vaccines used. It has the following fields:

-   `group`: A one-to-one field to the `Group` model, representing the group of organizational units for the sub-activity.
-   `subactivity`: A foreign key to the `SubActivity` model, representing the sub-activity to which the scope belongs.
-   `vaccine`: A choice field representing the vaccine used in the sub-activity. The choices are "mOPV2", "nOPV2", and "bOPV".

## APIs

The `SubActivity` API allows for the creation, retrieval, update, and deletion of sub-activities. The API endpoint is `/api/polio/campaigns_subactivities/`.

### Create

To create a new sub-activity, send a POST request to the endpoint with the following data:

```json
{
    "round_number": <round_number>,
    "campaign": <campaign_obr_name>,
    "name": <subactivity_name>,
    "start_date": <start_date>,
    "end_date": <end_date>,
    "scopes": [
        {
            "group": {
                "name": <group_name>,
                "org_units": [<org_unit_id>]
            },
            "vaccine": <vaccine_choice>
        }
    ]
}
```

### Retrieve

To retrieve all sub-activities, send a GET request to the endpoint. To retrieve a specific sub-activity, send a GET request to `/api/polio/campaigns_subactivities/<subactivity_id>/`.

### Update

To update a sub-activity, send a PUT request to `/api/polio/campaigns_subactivities/<subactivity_id>/` with the new data.

### Delete

To delete a sub-activity, send a DELETE request to `/api/polio/campaigns_subactivities/<subactivity_id>/`.

## Permissions

Only authenticated users can interact with the `SubActivity` API. The user must belong to the same account as the campaign associated with the round of the sub-activity.
