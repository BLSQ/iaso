import { LangOptions } from 'bluesquare-components';
import { useQueryClient } from 'react-query';
import { OrgUnitStatus } from '../domains/orgUnits/types/orgUnit';
import { Project } from '../domains/projects/types/project';

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
};

export type User = {
    id: number;
    first_name: string;
    last_name: string;
    username?: string;
    user_name?: string;
    email: string;
    account: Account;
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
};

export const getDisplayName = (
    user: Partial<User> | Partial<Profile>,
): string => {
    // Some endpoint have user_name and some username (without the _, fun)
    const userName = user.user_name ?? user?.username;
    if (!user.first_name && !user.last_name) {
        return userName || '';
    }
    return `${userName} (${user.first_name ? `${user.first_name}` : ''}${
        user.first_name && user.last_name ? ' ' : ''
    }${user.last_name ? `${user.last_name}` : ''}) `;
};

export default getDisplayName;

export const useCurrentUser = (): User => {
    const queryClient = useQueryClient();
    const currentUser = queryClient.getQueryData<User>('currentUser');
    return currentUser as User;
};

export const useIsLoggedIn = (): boolean => {
    const currentUser: User = useCurrentUser();
    return Boolean(currentUser);
};

export const useHasNoAccount = (): boolean => {
    const currentUser = useCurrentUser();
    return Boolean(currentUser && !currentUser.account);
};
