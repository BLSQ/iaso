import { QueryKey } from 'react-query';
import { AccountRetrieveCurrent } from 'Iaso/api/accounts';
import { RoutePath } from 'Iaso/constants/routes';
import { useCurrentAccount } from 'Iaso/domains/accounts/hooks';
import { MenuItem } from 'Iaso/domains/app/types';
import { useCurrentUser, User } from 'Iaso/utils/usersUtils';

/**
 * check if user has the permission
 *
 * @param {String} permission
 * @param {Object} user
 * @return {Boolean}
 */
export const userHasPermission = (
    permission: string,
    user?: Pick<User, 'permissions' | 'is_superuser'>,
): boolean => {
    if (!user) {
        return false;
    }

    return Boolean(user.is_superuser || user.permissions?.includes(permission));
};

/**
 * check if current logged-in user has the permission
 *
 * @param {String} permission
 * @return {Boolean}
 */
export const useCurrentUserHasPermission = (permission: string): boolean => {
    const currentUser = useCurrentUser();
    return userHasPermission(permission, currentUser);
};

/**
 * check if user has one of the permission
 *
 * @param {Array} permissions
 * @param {Object} user
 * @return {Boolean}
 */
export const userHasOneOfPermissions = (
    permissions: string[] = [],
    user?: Parameters<typeof userHasPermission>[1],
): boolean => {
    if (!user) {
        return false;
    }

    return Boolean(
        user.is_superuser || permissions.some(p => userHasPermission(p, user)),
    );
};

export const useCurrentUserHasOneOfPermissions = (
    permissions: string[],
): boolean => {
    const user = useCurrentUser();
    return userHasOneOfPermissions(permissions, user);
};

/**
 * Check if user has all the specified permissions.
 *
 * @param {Array} permissions - Array of permissions to check.
 * @param {Object} user - User object to check permissions against.
 * @return {Boolean} - Returns true if user has all the permissions, otherwise false.
 */
export const userHasAllPermissions = (
    permissions: string[],
    user?: Parameters<typeof userHasPermission>[1],
): boolean => {
    if (!user || !permissions.length) {
        return false;
    }

    return permissions.every(permission => userHasPermission(permission, user));
};

export const useCurrentUserHasAllPermissions = (
    permissions: string[],
): boolean => {
    const user = useCurrentUser();
    return userHasAllPermissions(permissions, user);
};

/**
 * list all submenu permission
 *
 * @param {Object} menuItem
 * @return {Array}
 */
export const listMenuPermission = (
    menuItem: MenuItem,
    permissions: string[] = [],
): string[] => {
    let permissionsTemp = [...permissions];
    if (menuItem) {
        if (
            menuItem.permissions &&
            menuItem.permissions.length > 0 &&
            !permissionsTemp.find(
                p => menuItem.permissions?.includes(p) ?? false,
            ) // Avoid duplicate permission
        ) {
            permissionsTemp = [...permissionsTemp, ...menuItem.permissions];
        }
        if (menuItem.subMenu) {
            menuItem.subMenu.forEach(subMenuItem => {
                const subPerms = listMenuPermission(
                    subMenuItem,
                    permissionsTemp,
                ).filter(sp => !permissionsTemp.includes(sp)); // Avoid duplicate permission
                permissionsTemp = [...permissionsTemp, ...subPerms];
            });
        }
    }
    return permissionsTemp;
};

/**
 * get the first permission of an user, ignoring root url permission
 *
 * @param {String[]} rootPermissions
 * @param {Object} user
 * @return {String}
 */
export const getFirstAllowedUrl = (
    rootPermissions: string[],
    userPermissions: string[],
    routes: RoutePath[],
): string | undefined => {
    const untestedPermissions = [...userPermissions];
    let newRoot: string | undefined;
    userPermissions.forEach((p, i) => {
        if (!newRoot && !rootPermissions.includes(p)) {
            newRoot = p;
            untestedPermissions.splice(i, 1);
        }
    });
    const newPath = routes
        .filter(route => route.baseUrl !== 'secret')
        .find(p => p.permissions?.some(kp => kp === newRoot));
    if (newPath) {
        return newPath.baseUrl;
    }
    if (untestedPermissions.length === 0) return undefined;
    return getFirstAllowedUrl(rootPermissions, untestedPermissions, routes);
};

/**
 * Check if user account has access to specified module.
 *
 * @param {String} module
 * @param {Object} user
 * @return {Boolean} - Returns true if user account has specified module, otherwise false.
 */
export const userHasAccessToModule = (
    module: NonNullable<AccountRetrieveCurrent['modules']>[number],
    account?: AccountRetrieveCurrent,
): boolean => {
    if (!account) {
        return false;
    }

    return !!account.modules?.includes(module);
};

export const useCurrentUserHasAccessToModule = (
    module: Parameters<typeof userHasAccessToModule>[0],
): boolean => {
    const account = useCurrentAccount();
    return userHasAccessToModule(module, account);
};

export const userHasRole = (user: User, userRoleId: number): boolean => {
    return user.is_superuser || user.user_roles.includes(userRoleId);
};
export const userHasOneOfRoles = (
    user: User,
    userRoleIds: number[],
): boolean => {
    return (
        user.is_superuser ||
        user.user_roles.some(role => userRoleIds.includes(role))
    );
};

export type ProfilesDropdownParams = Record<string, string>;
export const getProfilesDropdownQueryKey = (
    params: ProfilesDropdownParams,
    triggerWithEmptyQuery = true,
): QueryKey => [
    'profiles',
    'dropdown',
    new URLSearchParams(params).toString(),
    triggerWithEmptyQuery ? 'triggerWithEmptyQuery' : undefined,
];
