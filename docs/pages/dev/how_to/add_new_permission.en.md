# How to add a new permission in Iaso

## 1. Add permission in the model

- Go to `/hat/menupermissions/models.py``
- Add a private constant with the string value of the permission: `_MY_PERMISSION = "iaso_my_permission"``
- Add a constant to combine it with `_PREFIX`: `MY_PERMISSION = _PREFIX + _MY_PERMISSION`
- Add the permission to the `permissions` property of `CustomPermissionSupport`'s `Meta` class: `(_MY_PERMISSION, _("Access some stuff"))`

## 2. Include the permission in a module

- Go to `/hat/menupermissions/constants.py`
- Add the permission to a module from `MODULE_PERMISSIONS`
- If no existing module fits, create one (see exiting modules for inspiration)
- If a new module is created, add it to `MODULES` (in the same file)
- If it's a new module run migration to add it in modules options for the account

## 3. Include the permission in the corresponding group
- Go to `/hat/menupermissions/constants.py`
- Add the permission to a group from `PERMISSIONS_PRESENTATION`
- If no existing group fits, create one (see exiting groups for inspiration)
- If the corresponding group exists add the new permission to that group (see exiting groups for inspiration)

## 4. If the added permission must be coupled with another permission like read and edit
- Go to `/hat/menupermissions/constants.py`
- Add the added permission and it's related permission as an item of the `READ_EDIT_PERMISSIONS` dictionnary
- The item should have a key which reprensente the string name which will be displayed
- The item should have a dictionnary reprensenting the coupled permissions, the keys (should be two keys) are `read` and `edit` or other keys like `no-admin` and `admin`
- The item should look like `item_key": {"read": "added_permission", "edit": "coupled_permission"}`
- Add translations for all the keys(`item_key, read and edit`) and the tooltip message of the principal key(`item_key`)

## 5. Make and run migration

`docker compose run --rm iaso manage makemigrations && docker compose run --rm iaso manage migrate`


## 6. Add the permission in the front-end
- Go to `/hat/assets/js/apps/Iaso/utils/permissions.ts`. Add and export a constant with the permission key, in a similar way as what was done for the backend in step 1.
- When using the permission in the front-end: import the constant, don't write the key in a string.

## 7. Add translations in the front-end

- Add a translation for the permission, and its tooltip in `permissionMessages.ts`. The tooltip key should have the format: `<permission name>_tooltip` to enable the component to recognize and translate it.
- Add corresponding translations in `en.json` and `fr.json`

## 8. Add translation for new module (if applicable)

- Go to `/hat/assets/js/apps/Iaso/domains/modules/messages.ts`
- Add translation for the new module. The translation key should follow the pattern: `iaso.module.<module.codename.toLowerCase()>' 
    - Example: codename = "PAYMENTS" => translation key = iaso.module.payments