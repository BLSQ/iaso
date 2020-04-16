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
    permissions.forEach((p) => {
        if (userHasPermission(p, user)) {
            isAuthorised = true;
        }
    });
    return isAuthorised;
};
