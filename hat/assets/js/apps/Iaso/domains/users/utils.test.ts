import { describe, expect, it } from 'vitest';
import { getApiAccountsMeRetrieveResponseMock } from 'Iaso/api/accounts/endpoints/account/account.msw';
import { RoutePath } from 'Iaso/constants/routes';
import { MenuItem } from 'Iaso/domains/app/types';
import { User } from 'Iaso/utils/usersUtils';
import {
    getFirstAllowedUrl,
    getProfilesDropdownQueryKey,
    listMenuPermission,
    userHasAccessToModule,
    userHasAllPermissions,
    userHasOneOfPermissions,
    userHasOneOfRoles,
    userHasPermission,
    userHasRole,
} from './utils';

const createUser = (overrides: Partial<User> = {}): User => ({
    id: 1,
    first_name: 'Jane',
    last_name: 'Doe',
    username: 'jane.doe',
    email: 'jane@example.com',
    other_accounts: [],
    permissions: [],
    is_superuser: false,
    org_units: [],
    user_id: 1,
    user_roles: [],
    ...overrides,
});

describe('userHasPermission', () => {
    it('returns false when user is missing', () => {
        expect(
            userHasPermission('iaso.users', undefined as unknown as User),
        ).toBe(false);
    });

    it('returns false when user has no permissions array', () => {
        const user = createUser({
            permissions: undefined as unknown as string[],
        });

        expect(userHasPermission('iaso.users', user)).toBe(false);
    });

    it('returns true for superusers regardless of permissions', () => {
        const user = createUser({ is_superuser: true, permissions: [] });

        expect(userHasPermission('iaso.users', user)).toBe(true);
    });

    it('returns true when the permission is granted', () => {
        const user = createUser({ permissions: ['iaso.users'] });

        expect(userHasPermission('iaso.users', user)).toBe(true);
    });

    it('returns false when the permission is not granted', () => {
        const user = createUser({ permissions: ['iaso.forms'] });

        expect(userHasPermission('iaso.users', user)).toBe(false);
    });
});

describe('userHasOneOfPermissions', () => {
    it('returns false when user is missing', () => {
        expect(
            userHasOneOfPermissions(
                ['iaso.users'],
                undefined as unknown as User,
            ),
        ).toBe(false);
    });

    it('returns true for superusers', () => {
        const user = createUser({ is_superuser: true });

        expect(userHasOneOfPermissions(['iaso.users'], user)).toBe(true);
    });

    it('returns true when user has at least one permission', () => {
        const user = createUser({ permissions: ['iaso.forms'] });

        expect(
            userHasOneOfPermissions(['iaso.users', 'iaso.forms'], user),
        ).toBe(true);
    });

    it('returns false when user has none of the permissions', () => {
        const user = createUser({ permissions: ['iaso.projects'] });

        expect(
            userHasOneOfPermissions(['iaso.users', 'iaso.forms'], user),
        ).toBe(false);
    });
});

describe('userHasAllPermissions', () => {
    it('returns false when user is missing', () => {
        expect(
            userHasAllPermissions(['iaso.users'], undefined as unknown as User),
        ).toBe(false);
    });

    it('returns false when permissions list is empty', () => {
        const user = createUser({ permissions: ['iaso.users'] });

        expect(userHasAllPermissions([], user)).toBe(false);
    });

    it('returns true when user has every permission', () => {
        const user = createUser({
            permissions: ['iaso.users', 'iaso.forms'],
        });

        expect(userHasAllPermissions(['iaso.users', 'iaso.forms'], user)).toBe(
            true,
        );
    });

    it('returns false when user is missing one permission', () => {
        const user = createUser({ permissions: ['iaso.users'] });

        expect(userHasAllPermissions(['iaso.users', 'iaso.forms'], user)).toBe(
            false,
        );
    });
});

describe('listMenuPermission', () => {
    it('returns an empty array for a missing menu item', () => {
        expect(listMenuPermission(undefined as unknown as MenuItem)).toEqual(
            [],
        );
    });

    it('collects permissions from a menu item', () => {
        const menuItem: MenuItem = {
            label: 'Users',
            permissions: ['iaso.users'],
        };

        expect(listMenuPermission(menuItem)).toEqual(['iaso.users']);
    });

    it('collects permissions from nested submenus without duplicates', () => {
        const menuItem: MenuItem = {
            label: 'Root',
            permissions: ['iaso.root'],
            subMenu: [
                {
                    label: 'Users',
                    permissions: ['iaso.users'],
                },
                {
                    label: 'Forms',
                    permissions: ['iaso.forms'],
                },
            ],
        };

        expect(listMenuPermission(menuItem)).toEqual([
            'iaso.root',
            'iaso.users',
            'iaso.forms',
        ]);
    });
});

describe('getFirstAllowedUrl', () => {
    const routes: RoutePath[] = [
        {
            baseUrl: 'users',
            routerUrl: 'users/*',
            permissions: ['iaso.users'],
            element: null as unknown as RoutePath['element'],
        },
        {
            baseUrl: 'forms',
            routerUrl: 'forms/*',
            permissions: ['iaso.forms'],
            element: null as unknown as RoutePath['element'],
        },
        {
            baseUrl: 'secret',
            routerUrl: 'secret/*',
            permissions: ['iaso.secret'],
            element: null as unknown as RoutePath['element'],
        },
    ];

    it('returns the first matching route for a non-root permission', () => {
        expect(
            getFirstAllowedUrl(
                ['iaso.dashboard'],
                ['iaso.dashboard', 'iaso.users', 'iaso.forms'],
                routes,
            ),
        ).toBe('users');
    });

    it('skips secret routes', () => {
        expect(
            getFirstAllowedUrl(['iaso.dashboard'], ['iaso.secret'], routes),
        ).toBeUndefined();
    });

    it('returns undefined when no route matches a non-root permission', () => {
        expect(
            getFirstAllowedUrl(['iaso.dashboard'], ['iaso.unknown'], routes),
        ).toBeUndefined();
    });
});

describe('userHasAccessToModule', () => {
    it('returns false when user is missing', () => {
        expect(userHasAccessToModule('DATA_COLLECTION_FORMS', undefined)).toBe(
            false,
        );
    });

    it('returns true when the account has the module', () => {
        const account = getApiAccountsMeRetrieveResponseMock({
            modules: ['DATA_COLLECTION_FORMS'],
        });

        expect(userHasAccessToModule('DATA_COLLECTION_FORMS', account)).toBe(
            true,
        );
    });

    it('returns false when the account does not have the module', () => {
        const account = getApiAccountsMeRetrieveResponseMock({
            modules: [],
        });

        expect(userHasAccessToModule('DATA_COLLECTION_FORMS', account)).toBe(
            false,
        );
    });
});

describe('userHasRole', () => {
    it('returns true for superusers', () => {
        const user = createUser({ is_superuser: true, user_roles: [] });

        expect(userHasRole(user, 42)).toBe(true);
    });

    it('returns true when the role is assigned', () => {
        const user = createUser({ user_roles: [1, 2, 3] });

        expect(userHasRole(user, 2)).toBe(true);
    });

    it('returns false when the role is not assigned', () => {
        const user = createUser({ user_roles: [1, 3] });

        expect(userHasRole(user, 2)).toBe(false);
    });
});

describe('userHasOneOfRoles', () => {
    it('returns true for superusers', () => {
        const user = createUser({ is_superuser: true, user_roles: [] });

        expect(userHasOneOfRoles(user, [1, 2])).toBe(true);
    });

    it('returns true when user has one of the roles', () => {
        const user = createUser({ user_roles: [3, 4] });

        expect(userHasOneOfRoles(user, [1, 4])).toBe(true);
    });

    it('returns false when user has none of the roles', () => {
        const user = createUser({ user_roles: [3, 4] });

        expect(userHasOneOfRoles(user, [1, 2])).toBe(false);
    });
});

describe('getProfilesDropdownQueryKey', () => {
    it('builds a stable query key from params', () => {
        expect(
            getProfilesDropdownQueryKey({ search: 'jane', team: '1' }),
        ).toEqual([
            'profiles',
            'dropdown',
            'search=jane&team=1',
            'triggerWithEmptyQuery',
        ]);
    });

    it('omits the empty-query flag when disabled', () => {
        expect(getProfilesDropdownQueryKey({ search: 'jane' }, false)).toEqual([
            'profiles',
            'dropdown',
            'search=jane',
            undefined,
        ]);
    });
});
