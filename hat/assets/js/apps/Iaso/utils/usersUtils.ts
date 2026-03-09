import { LangOptions, textPlaceholder } from 'bluesquare-components';
import { useQueryClient } from 'react-query';
import {
    ProfileListResponseItem,
    ProfileRetrieveResponseItem,
} from 'Iaso/domains/users/types';
import { OrgUnitStatus } from '../domains/orgUnits/types/orgUnit';
import { Project } from '../domains/projects/types/project';
import { userHasPermission } from '../domains/users/utils';
import * as Permissions from './permissions';

export type Profile = {
    id: string;
    first_name: string;
    user_name?: string;
    username?: string;
    last_name: string;
    email: string;
    language?: null | undefined | string;
    user_id: number;
    color?: string;
    phone_number?: string | null;
    country_code?: string | null;
    projects?: Project[];
};

export type DataSource = {
    name: string;
    description?: string;
    id: number;
    url: string;
    created_at: number;
    updated_at: number;
    versions: {
        number: number;
        description?: string;
        id: number;
        created_at: number;
        updated_at: number;
        org_units_count: number;
    }[];
    tree_config_status_fields: OrgUnitStatus[];
};

export type DefaultVersion = {
    data_source: DataSource;
    number: number;
    description?: null;
    id: number;
    created_at: number;
    updated_at: number;
};

export type SourceVersion = {
    source?: DefaultVersion;
    version?: DataSource;
};

export type Account = {
    name: string;
    id: number;
    created_at: number;
    updated_at: number;
    default_version?: DefaultVersion;
    feature_flags: string[];
    modules: string[];
    user_manual_path?: string;
    forum_path?: string;
};

export type User = {
    id: number;
    first_name: string;
    last_name: string;
    username: string;
    user_name?: string;
    email: string;
    account?: Account;
    other_accounts: Account[];
    permissions: string[];
    is_staff?: boolean;
    is_superuser: boolean;
    org_units: {
        name: string;
        id: string;
    }[];
    projects?: Project[];
    language?: LangOptions;
    user_id: number;
    dhis2_id?: string;
    editable_org_unit_type_ids?: number[];
    user_roles: number[];
    user_roles_editable_org_unit_type_ids?: number[];
    color?: string;
};

export const getDisplayName = (
    user:
        | Partial<ProfileRetrieveResponseItem>
        | (Partial<ProfileListResponseItem> &
              Partial<
                  Pick<
                      User,
                      'user_name' | 'username' | 'first_name' | 'last_name'
                  >
              >),
): string => {
    if (!user) {
        return textPlaceholder;
    }
    // Some endpoint have user_name and some username (without the _, fun)
    // todo : for legacy compatibility, we kept username, user_name, first_name, last_name.. will be removed later.
    const userName =
        user.userName ?? (user as any).user_name ?? (user as any)?.username;
    const firstName = user?.firstName ?? (user as any).first_name;
    const lastName = user?.lastName ?? (user as any)?.last_name;

    if (!firstName && !lastName) {
        return userName || '';
    }

    return `${userName} (${firstName ? `${firstName}` : ''}${
        firstName && lastName ? ' ' : ''
    }${lastName ? `${lastName}` : ''})`;
};

export default getDisplayName;

export const useCurrentUser = (): ProfileRetrieveResponseItem => {
    const queryClient = useQueryClient();
    const currentUser =
        queryClient.getQueryData<ProfileRetrieveResponseItem>('currentUser');
    return currentUser as ProfileRetrieveResponseItem;
};

export const useIsLoggedIn = (): boolean => {
    const currentUser: ProfileRetrieveResponseItem = useCurrentUser();
    return Boolean(currentUser);
};

export const useHasNoAccount = (): boolean => {
    const currentUser = useCurrentUser();
    return Boolean(currentUser && !currentUser.account);
};

export const useCheckUserHasWriteTypePermission = (): ((
    orgUnitTypeId?: number,
) => boolean) => {
    const currentUser = useCurrentUser();
    return (orgUnitTypeId?: number) => {
        if (!currentUser) return false;

        const editableTypeIds = [
            ...(currentUser.editableOrgUnitTypeIds ?? []),
            ...(currentUser.userRolesEditableOrgUnitTypeIds ?? []),
        ];

        return (
            editableTypeIds.length === 0 ||
            (orgUnitTypeId !== undefined &&
                editableTypeIds.includes(orgUnitTypeId))
        );
    };
};

export const useCheckUserHasWritePermissionOnOrgunit = (
    orgUnitTypeId?: number,
): boolean => {
    const getHasWriteByTypePermission = useCheckUserHasWriteTypePermission();
    const hasWriteByTypePermission = getHasWriteByTypePermission(orgUnitTypeId);
    const currentUser = useCurrentUser();
    return (
        userHasPermission(Permissions.ORG_UNITS, currentUser) &&
        hasWriteByTypePermission
    );
};
