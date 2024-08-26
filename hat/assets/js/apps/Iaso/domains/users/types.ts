import { Profile, User } from '../../utils/usersUtils';
import { Project } from '../projects/types/project';
import { UserRole } from '../userRoles/types/userRoles';

/* eslint-disable camelcase */
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
    country_code: ValueAndErrors<string | null>;
    projects: ValueAndErrors<Project[] | null>;
};

export type InitialUserData = Partial<Profile> & { is_superuser?: boolean };

export type UserDisplayData = Pick<
    User,
    'id' | 'username' | 'user_name' | 'first_name' | 'last_name'
>;
