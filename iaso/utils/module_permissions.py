from hat.menupermissions.constants import MODULE_PERMISSIONS


def account_module_permissions(account_modules):
    """
    It returns modules and their permissions linked to the current account
        - it loops on all account linked modules
        - at each loop it check if the current module it exist as one of the MODULE_PERMISSIONS's keys
        - it adds in the modules_permissions array(list)
    It gets as parameters the account linked modules (account_modules)
    """
    modules_permissions = set()
    modules = MODULE_PERMISSIONS.keys()
    for module in account_modules:
        if module in modules:
            modules_permissions = modules_permissions | set(MODULE_PERMISSIONS[module])
    return modules_permissions
