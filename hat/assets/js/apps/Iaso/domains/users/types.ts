import { Profile } from '../../utils/usersUtils';

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
    language: ValueAndErrors<string | null>;
};

export type InitialUserData = Partial<Profile> & { is_superuser?: boolean };
