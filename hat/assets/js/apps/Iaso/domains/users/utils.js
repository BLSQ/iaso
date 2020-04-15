/**
 * check if user has the permission
 *
 * @param {String} permission
 * @param {Object} userHasPermission
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
