import { OrgUnit } from 'Iaso/domains/orgUnits/types/orgUnit';
import { User } from 'Iaso/utils/usersUtils';
import { Project } from '../projects/types/project';
import { UserRole as TypeUserRole } from '../userRoles/types/userRoles';

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
    user_roles_permissions: ValueAndErrors<TypeUserRole[]>;
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

export type InitialUserData = Partial<ProfileRetrieveResponseItem>;

export type UserDisplayData = Pick<
    User,
    'id' | 'username' | 'user_name' | 'first_name' | 'last_name'
>;

export type SaveUserPasswordQuery = {
    password: string;
    confirmPassword: string;
};

type UserRole = {
    id: number | string;
    name: string;
};

export type NestedProject = {
    id: string | number;
    name: string;
    color?: string;
};

export type ExtendedNestedProject = NestedProject & {
    appId: string | number;
};

type NestedOrgUnit = {
    name: string;
    shortName: string;
    id: string | number;
    source: string;
    sourceId: number;
    sourceRef: null;
    parentId: null;
    orgUnitTypeId: null;
    orgUnitTypeName: null;
    orgUnitTypeDepth: null;
    createdAt: null;
    updatedAt: null;
    aliases: null;
    validationStatus: null;
    latitude: null;
    longitude: null;
    altitude: null;
    hasGeoJson: null;
    version: null;
    openingDate: null;
    closedDate: null;
};

type UserRolePermission = {
    id: string | number;
    name: string;
    groupId: number;
    permissions: string[];
    createdAt: number;
    updatedAt: number;
};

type DataSource = {
    name: string;
    description?: string;
    id: number | string;
    url: string;
    treeConfigStatusFields: string[];
    createdAt: number;
    updatedAt: number;
};

type DefaultVersion = {
    dataSource: DataSource;
    number: number;
    description?: string;
    id: string | number;
    createdAt: number;
    updatedAt: number;
};

type Account = {
    name: string;
    id: string | number;
    createdAt: number;
    updatedAt: number;
    defaultVersion?: DefaultVersion;
    featureFlags?: string[];
    userManualPath: string;
    forumPath: string;
    analyticsScript?: string;
};

export type ProfileListResponseItem = {
    id: number | string;
    firstName: string;
    userName: string;
    lastName: string;
    email: string;
    language?: string;
    userId: number | string;
    phoneNumber: string;
    countryCode?: string;
    editableOrgUnitTypeIds: string[] | number[];
    userRolesEditableOrgUnitTypeIds: string[] | number[];
    userRoles: UserRole[];
    color: string;
    projects: NestedProject[];
    userPermissions: string[];
    isStaff: boolean;
    isSuperuser: boolean;
    orgUnits: NestedOrgUnit[];
};

export type ProfileRetrieveResponseItem = {
    id: number | string;
    firstName: string;
    userName: string;
    lastName: string;
    email: string;
    permissions: string[];
    userPermissions: string[];
    isStaff: boolean;
    isSuperuser: boolean;
    userRoles: string[] | number[];
    userRolesPermissions: UserRolePermission[];
    language?: string;
    organization?: string;
    userId: string | number;
    dhis2Id?: string;
    homePage?: string;
    projects: ExtendedNestedProject[];
    phoneNumber?: string;
    countryCode?: string;
    otherAccounts: Account[];
    editableOrgUnitTypeIds: string[] | number[];
    userRolesEditableOrgUnitTypeIds: string[] | number[];
    account: Account & { modules: string[] };
    orgUnits: OrgUnit[];
    color: string;
};
