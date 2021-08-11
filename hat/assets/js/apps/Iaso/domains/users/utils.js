import { routeConfigs } from '../../constants/routes';

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
export const userHasOneOfPermissions = (permissions, user) => {
    if (!user) {
        return false;
    }
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
 * @return {Boolean}
 */
export const listMenuPermission = (menuItem, permissions = []) => {
    let permissionsTemp = [...permissions];
    if (menuItem) {
        if (
            menuItem.permission &&
            !permissionsTemp.find(p => p === menuItem.permission) // Avoid duplicate permission
        ) {
            permissionsTemp.push(menuItem.permission);
        }
        menuItem.subMenu &&
            menuItem.subMenu.forEach(subMenuItem => {
                const subPerms = listMenuPermission(
                    subMenuItem,
                    permissionsTemp,
                ).filter(sp => !permissionsTemp.includes(sp)); // Avoid duplicate permission
                permissionsTemp = permissionsTemp.concat(subPerms);
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
export const getFirstAllowedUrl = (rootPermission, user) => {
    let newRoot;
    user?.permissions.forEach(p => {
        if (!newRoot && p !== rootPermission) {
            newRoot = p;
        }
    });
    const newPath = routeConfigs.find(p => p.permission === newRoot);
    return newPath.baseUrl;
};
