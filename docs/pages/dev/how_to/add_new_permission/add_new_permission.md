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

## 3. Include the permission in the corresponding group
- Go to `/hat/menupermissions/constants.py`
- Add the permission to a group from `PERMISSIONS_PRESENTATION`
- If no existing group fits, create one (see exiting groups for inspiration)
- If the corresponding group exists add the new permission to that group (see exiting groups for inspiration)

## 4. Make and run migration

`docker-compose run --rm iaso manage makemigration && docker-compose run --rm iaso manage migrate`

## 5. Add translations in the front-end

- Add a translation for the permission, and its tooltip in `permissionMessages.ts`
- Add corresponding translations in `en.json` and `fr.json`

## 6. Add translation for new module (if applicable)

- Go to `/hat/assets/js/apps/Iaso/domains/modules/messages.ts`
- Add translation for the new module. The translation key should follow the pattern: `iaso.module.<module.codename.toLowerCase()>' 
    - Example: codename = "PAYMENTS" => translation key = iaso.module.payments