import { User } from '../../utils/usersUtils';
import { Project } from '../projects/types/project';
import { UserRole } from '../userRoles/types/userRoles';

export type ValueAndErrors<T> = {
    value: T;
    errors: string[];
};

export type UserDialogData = {
    id?: ValueAndErrors<string | number | null>;
    first_name?: ValueAndErrors<string>;
    last_name?: ValueAndErrors<string>;
    user_name: ValueAndErrors<string>;
    email?: ValueAndErrors<string>;
    send_email_invitation: ValueAndErrors<boolean>;
    dhis2_id?: ValueAndErrors<string>;
    home_page?: ValueAndErrors<string>;
    org_units?: ValueAndErrors<number[]>;
    permissions: ValueAndErrors<string[]>;
    user_permissions: ValueAndErrors<string[]>;
    user_roles_permissions: ValueAndErrors<UserRole[]>;
    language: ValueAndErrors<string | null>;
    password: ValueAndErrors<string | null>;
    phone_number: ValueAndErrors<string | null>;
    country_code: ValueAndErrors<string | number | null>;
    projects: ValueAndErrors<Project[] | null>;
    editable_org_unit_type_ids: ValueAndErrors<number[] | null>;
    user_roles_editable_org_unit_type_ids: ValueAndErrors<number[] | []>;
    has_multiple_accounts: ValueAndErrors<boolean>;
    organization: ValueAndErrors<string | undefined>;
    color: ValueAndErrors<string | undefined>;
};

export type InitialUserData = Partial<Profile> & { is_superuser?: boolean };

export type UserDisplayData = Pick<
    User,
    'id' | 'username' | 'user_name' | 'first_name' | 'last_name'
>;

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

export type SaveUserPasswordQuery = {
    password: string,
    confirm_password: string
}