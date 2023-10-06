from django.apps import AppConfig
from django.db.models.signals import post_migrate
from hat.menupermissions.constants import MODULE_PERMISSIONS, MODULES


def get_module(permission_code_name, iaso_permission, iaso_module):
    for module_codename, permissions in MODULE_PERMISSIONS.items():  # loop on modules from constants
        if permission_code_name in permissions:  # check if the permission is in the current module
            iaso_permission = iaso_permission.objects.filter(
                module__codename=module_codename, permission__codename=permission_code_name
            )
            if iaso_permission:  # check if the link between the current module and the permission exists
                return None
            else:
                module = iaso_module.objects.filter(codename=module_codename)
                if module:  # check if the module already exists in the db
                    return module.first()
                else:
                    filtered_module = list(
                        filter(lambda module: module["codename"] == module_codename, MODULES)
                    )  # get the module to be created
                    return iaso_module.objects.create(
                        name=filtered_module[0]["name"], codename=filtered_module[0]["codename"]
                    )


def create_iaso_permissions_callback(sender, **kwargs):
    from iaso.models import Permission as IasoPermission, Module
    from django.contrib.auth.models import Permission as AuthPermission

    if "plan" in kwargs:
        plan = kwargs["plan"]
        if plan:  # Check if there is a new migration
            (plan_migration, plan_bool) = plan[0]
            if not plan_bool:  # Check if it's not a rollback migration
                if hasattr(plan_migration, "operations"):  # Check if there are operations in the migration
                    operation = plan_migration.operations[0]
                    if hasattr(operation, "options"):  # Check if it has options
                        if "permissions" in operation.options:  # Check if the migration is related to new permissions
                            permissions = operation.options["permissions"]
                            for permission in permissions:  # loop on all permissions in the migration
                                iaso_permission = IasoPermission.objects.filter(
                                    permission__codename=permission[0]
                                ).first()
                                if (
                                    not iaso_permission
                                ):  # check if the current auth permission has already iaso permission
                                    auth_permission = AuthPermission.objects.filter(codename=permission[0])
                                    if auth_permission:  # check if the auth permission exists
                                        iaso_permission = IasoPermission.objects.create(
                                            permission=auth_permission.first()
                                        )  # create the iaso permission
                                module = get_module(permission[0], IasoPermission, Module)  # get the module
                                if module:  # link the module to iaso permission if the module already exist
                                    iaso_permission.module = module
                                    iaso_permission.save()


class MenupermissionsConfig(AppConfig):
    name = "hat.menupermissions"

    def ready(self) -> None:
        post_migrate.connect(create_iaso_permissions_callback, sender=self)
