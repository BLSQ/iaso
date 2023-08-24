/**
 * check if user has the permission
 *
 * @param {String} permission
 * @param {Object} user
 * @return {Boolean}
 */
export const userHasPermission = (permission, user) => {
    if (!user) {
        return false;
    }
    if (!user.permissions || !Array.isArray(user.permissions)) return false;
    if (user.is_superuser || user.permissions.find(p => p === permission)) {
        return true;
    }
    return false;
};

/**
 * check if user has one of the permission
 *
 * @param {Array} permissions
 * @param {Object} user
 * @return {Boolean}
 */
export const userHasOneOfPermissions = (permissions = [], user) => {
    if (!user) {
        return false;
    }
    if (permissions.length === 0) return true;
    let isAuthorised = false;
    permissions.forEach(p => {
        if (!!p && userHasPermission(p, user)) {
            isAuthorised = true;
        }
    });
    return isAuthorised;
};

/**
 * list all submenu permission
 *
 * @param {Object} menuItem
 * @return {Array}
 */
export const listMenuPermission = (menuItem, permissions = []) => {
    let permissionsTemp = [...permissions];
    if (menuItem) {
        if (
            menuItem?.permissions?.length > 0 &&
            !permissionsTemp.find(p => menuItem.permissions.includes(p)) // Avoid duplicate permission
        ) {
            permissionsTemp = [...permissionsTemp, ...menuItem.permissions];
        }
        menuItem.subMenu &&
            menuItem.subMenu.forEach(subMenuItem => {
                const subPerms = listMenuPermission(
                    subMenuItem,
                    permissionsTemp,
                ).filter(sp => !permissionsTemp.includes(sp)); // Avoid duplicate permission
                permissionsTemp = [...permissionsTemp, ...subPerms];
            });
    }
    return permissionsTemp;
};

/**
 * get the first permission of an user, ignoring root url permission
 *
 * @param {String} rootPermission
 * @param {Object} user
 * @return {String}
 */
export const getFirstAllowedUrl = (
    rootPermissions,
    userPermissions,
    routes,
) => {
    const untestedPermissions = [...userPermissions];
    let newRoot;
    userPermissions.forEach((p, i) => {
        if (!newRoot && !rootPermissions.includes(p)) {
            newRoot = p;
            untestedPermissions.splice(i, 1);
        }
    });
    const newPath = routes.find(p => p.permissions?.some(kp => kp === newRoot));
    if (newPath) {
        return newPath.baseUrl;
    }
    if (untestedPermissions.length === 0) return undefined;
    return getFirstAllowedUrl(rootPermissions, untestedPermissions, routes);
};
