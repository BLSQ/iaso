import { UrlParams } from 'bluesquare-components';

export type UserRole = {
    id: number;
    name: string;
    created_at: string;
    updated_at?: string;
    editable_org_unit_type_ids?: number[];
    permissions?: string[];
};
export type UserRolesFilterParams = {
    name?: string;
    accountId?: number;
};

export type UserRoleParams = UrlParams &
    UserRolesFilterParams & {
        select?: (data: Array<UserRole>) => Array<any>;
    };

export type Permission = {
    id: number;
    name: string;
    codename: string;
};
