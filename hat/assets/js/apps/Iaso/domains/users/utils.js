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
        if (userHasPermission(p, user)) {
            isAuthorised = true;
        }
    });
    return isAuthorised;
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
    user.permissions.forEach(p => {
        if (!newRoot && p !== rootPermission) {
            newRoot = p;
        }
    });
    const newPath = routeConfigs.find(p => p.permission === newRoot);
    return newPath.baseUrl;
};
