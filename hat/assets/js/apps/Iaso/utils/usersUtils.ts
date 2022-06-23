/* eslint-disable camelcase */
import { useSelector } from 'react-redux';

export type Profile = {
    id: string;
    first_name: string;
    user_name: string;
    last_name: string;
    email: string;
    language?: null | undefined | string;
    user_id: number;
};

type User = {
    id: number;
    first_name: string;
    last_name: string;
    user_name: string;
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
    is_superuser: boolean;
    org_units: any[];
    language?: string;
    user_id: number;
    dhis2_id?: string;
};

export const getDisplayName = (user: User | Profile): string => {
    if (!user.first_name && !user.last_name) {
        return user.user_name;
    }
    return `${user.user_name} (${user.first_name ? `${user.first_name}` : ''}${
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
