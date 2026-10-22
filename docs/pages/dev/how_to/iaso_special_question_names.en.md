# IASO special question names

On top of providing a way to receive the profile's value in follow-up forms (See [Create forms for entities](./create_forms_for_entities.en.md#follow-up-forms)), 
IASO has a few question names that are filled-in automatically.

The following are special question names.

| Question name           | Information                                                              |
|-------------------------|--------------------------------------------------------------------------|
| current_ou_id           | The OrgUnit ID for which this form has been opened                       |
| current_ou_name         | The OrgUnit name for which this form has been opened                     |
| current_ou_type_id      | The OrgUnit's Type ID for which this form has been opened                |
| current_ou_type_name    | The OrgUnit's Type name for which this form has been opened              |
| current_ou_is_root      | Whether the OrgUnit which this form has been opened is root              |
| current_ou_group_ids    | The OrgUnit's group IDs, separated by spaces                             |
| current_ou_group_names  | The OrgUnit's group names, separated by spaces                           |
| parent**X**_ou_id       | The OrgUnit's Xth parent's ID for which this form has been opened        |
| parent**X**_ou_name     | The OrgUnit's Xth parent's name for which this form has been opened      |
| parent**X**_ou_type_id  | The OrgUnit's Xth parent's Type ID for which this form has been opened   |
| parent**X**ou_type_name | The OrgUnit's Xth parent's Type name for which this form has been opened |
| parent**X**_ou_is_root  | Whether the OrgUnit's Xth parent which this form has been opened is root |
| parent**X**_ou_group_ids   | The OrgUnit's Xth parent's group IDs, separated by spaces             |
| parent**X**_ou_group_names | The OrgUnit's Xth parent's group names, separated by spaces           |

Note: In `parent**X**_` value, `X` is replaced by a number (1, 2, 3, etc.) going up to the root parent.

Group IDs are space separated so they can be used like a multiple choice answer, e.g. `selected(${current_ou_group_ids}, '42')`.
In group names, whitespace is replaced by `_` (e.g. `Southern Area` becomes `Southern_Area`) so each group stays a single value,
and names are listed in the same order as the IDs (usable with `selected-at()`). The comparison is case sensitive.
Prefer the IDs over the names for the form logic: groups can be renamed.

To display the group names in a human readable way, use `translate()`, which replaces characters one by one:
`translate(${current_ou_group_names}, ' _', ', ')` turns the separating spaces into `,` and the `_` back into spaces,
e.g. `Southern_Area GOV` becomes `Southern Area,GOV`. A `_` that was already in a group name also becomes a space.

## Example

| type              | name               | label                 | calculation |
|-------------------|--------------------|-----------------------|-------------|
| calculate         | current_ou_id      | Current OrgUnit ID    | ""          |
| calculate         | parent3_ou_is_root | Is third parent root? | 0           |
| calculate         | current_ou_group_ids | Current OrgUnit group IDs | ""     |
| calculate         | current_ou_group_names | Current OrgUnit group names | ""   |
| calculate         | current_ou_groups_label | Current OrgUnit groups (readable) | translate(${current_ou_group_names}, ' _', ', ') |
| note              | current_ou_groups_display | Groups: ${current_ou_groups_label} |  |
| calculate         | in_group_42 | Is in group 42? | if(selected(${current_ou_group_ids}, '42'), 1, 0) |
| calculate         | in_southern_area | Is in Southern Area? | if(selected(${current_ou_group_names}, 'Southern_Area'), 1, 0) |

A complete example is available in [form_with_org_unit_groups_injectables.xlsx](https://github.com/BLSQ/iaso/blob/develop/iaso/tests/fixtures/form_with_org_unit_groups_injectables.xlsx).
