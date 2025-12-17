---
version: 1
scope: repository
---
Permissions:
- Backend: hat/menupermissions/models.py add _PERM + PERM; add to CustomPermissionSupport.Meta.permissions; map in hat/menupermissions/constants.py MODULE_PERMISSIONS (add module + MODULES if needed); add to PERMISSIONS_PRESENTATION; add paired entry in READ_EDIT_PERMISSIONS if relevant; run migrations.
- Frontend: add constant in hat/assets/js/apps/Iaso/utils/permissions.ts; translations in permissionMessages.ts and en/fr json; if new module, add iaso.module.<codename.lower()> in hat/assets/js/apps/Iaso/domains/modules/messages.ts.

