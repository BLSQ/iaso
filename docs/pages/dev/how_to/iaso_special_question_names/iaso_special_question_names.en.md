# Iaso special question names

On top of providing a way to receive the profile's value in follow-up forms (See [Create forms for entities](../create_forms_for_entities/create_forms_for_entities.en.md#follow-up-forms)), 
IASO has a few question names that are filled-in automatically.

The following are special question names.

| Question name           | Information                                                              |
|-------------------------|--------------------------------------------------------------------------|
| current_ou_id           | The OrgUnit ID for which this form has been opened                       |
| current_ou_name         | The OrgUnit name for which this form has been opened                     |
| current_ou_type_id      | The OrgUnit's Type ID for which this form has been opened                |
| current_ou_type_name    | The OrgUnit's Type name for which this form has been opened              |
| current_ou_is_root      | Whether the OrgUnit which this form has been opened is root              |
| parent**X**_ou_id       | The OrgUnit's Xth parent's ID for which this form has been opened        |
| parent**X**_ou_name     | The OrgUnit's Xth parent's name for which this form has been opened      |
| parent**X**_ou_type_id  | The OrgUnit's Xth parent's Type ID for which this form has been opened   |
| parent**X**ou_type_name | The OrgUnit's Xth parent's Type name for which this form has been opened |
| parent**X**_ou_is_root  | Whether the OrgUnit's Xth parent which this form has been opened is root |

Note: In `parent**X**_` value, `X` is replaced by a number (1, 2, 3, etc.) going up to the root parent.

## Example

| type              | name               | label                 | calculation |
|-------------------|--------------------|-----------------------|-------------|
| calculate         | current_ou_id      | Current OrgUnit ID    | ""          |
| calculate         | parent3_ou_is_root | Is third parent root? | 0           |