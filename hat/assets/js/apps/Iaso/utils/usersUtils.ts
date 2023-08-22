/* eslint-disable camelcase */
import { useSelector } from 'react-redux';
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
};

export type User = {
    id: number;
    first_name: string;
    last_name: string;
    user_name?: string;
    username?: string;
    email: string;
    account: {
        name: string;
        id: number;
        created_at: number;
        updated_at: number;
        default_version?: {
            data_source: {
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
            };
            number: number;
            description?: null;
            id: number;
            created_at: number;
            updated_at: number;
        };
        feature_flags: string[];
    };
    permissions: string[];
    is_staff?: boolean;
    is_superuser: boolean;
    org_units: {
        name: string;
        id: string;
    }[];
    projects?: Project[];
    language?: string;
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

type Users = {
    current: User;
};
type State = {
    users: Users;
};

// Replace with react query when we can
export const useCurrentUser = (): User => {
    // noinspection UnnecessaryLocalVariableJS
    const currentUser = useSelector((state: State) => state.users.current);
    return currentUser;
};

export const useHasNoAccount = (): boolean => {
    const currentUser = useCurrentUser();
    return Boolean(currentUser && !currentUser.account);
};
