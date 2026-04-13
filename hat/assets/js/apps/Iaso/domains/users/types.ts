import { OrgUnit } from 'Iaso/domains/orgUnits/types/orgUnit';
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
    user_roles?: ValueAndErrors<Array<UserRole | number>>;
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

export interface BulkImportDefaults {
    default_permissions?: number[];
    default_projects?: number[];
    default_user_roles?: number[];
    default_profile_language?: string;
    default_org_units?: number[];
    default_teams?: number[];
    default_organization?: string;
}

export interface BulkImportPayload extends BulkImportDefaults {
    file: File[];
}

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
    password: string;
    confirm_password: string;
};

type NestedUserRole = {
    id: number | string;
    name: string;
};

type NestedProject = {
    id: string | number;
    name: string;
    color?: string;
};

type NestedOrgUnit = {
    name: string;
    short_name: string;
    id: string | number;
    source: string;
    source_id: number;

    source_ref: null;
    parent_id: null;
    org_unit_type_id: null;
    org_unit_type_name: null;
    org_unit_type_depth: null;
    created_at: null;
    updated_at: null;
    aliases: null;
    validation_status: null;
    latitude: null;
    longitude: null;
    altitude: null;
    has_geo_json: null;
    version: null;
    opening_date: null;
    closed_date: null;
};

type UserRolePermission = {
    id: string | number;
    name: string;
    group_id: number;
    permissions: string[];
    created_at: number;
    updated_at: number;
};

type DataSource = {
    name: string;
    description?: string;
    id: number | string;
    url: string;
    tree_config_status_fields: string[];
    created_at: number;
    updated_at: number;
};

type DefaultVersion = {
    data_source: DataSource;
    number: number;
    description?: string;
    id: string | number;
    created_at: number;
    updated_at: number;
};
type Account = {
    name: string;
    id: string | number;
    created_at: number;
    updated_at: number;
    default_version?: DefaultVersion;
    feature_flags?: string[];
    user_manual_path: string;
    forum_path: string;
    analytics_script?: string;
};

export type ProfileListResponseItem = {
    id: number | string;
    first_name: string;
    user_name: string;
    last_name: string;
    email: string;
    language?: string;
    user_id: number | string;
    phone_number: string;
    country_code?: string;
    editable_org_unit_type_ids: string[] | number[];
    user_roles_editable_org_unit_type_ids: string[] | number[];
    user_roles: NestedUserRole[];
    color: string;
    projects: NestedProject[];
    user_permissions: string[];
    is_staff: boolean;
    is_superuser: boolean;
    org_units: NestedOrgUnit[];
};

export type ProfileRetrieveResponseItem = {
    id: number | string;
    first_name: string;
    user_name: string;
    last_name: string;
    email: string;
    permissions: string[];
    user_permissions: string[];
    is_staff: boolean;
    is_superuser: boolean;
    user_roles: string[] | number[];
    user_roles_permissions: UserRolePermission[];
    language?: string;
    organization?: string;
    user_id: string | number;
    dhis2_id?: string;
    home_page?: string;
    projects: Array<NestedProject & { app_id: string | number }>;
    phone_number?: string;
    country_code?: string;
    other_account: Account[];
    editable_org_unit_type_ids: string[] | number[];
    user_roles_editable_org_unit_type_ids: string[] | number[];
    account: Account & { modules: string[] };
    org_units: OrgUnit[];
    color: string;
};
