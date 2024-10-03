/* eslint-disable camelcase */
import { UrlParams } from 'bluesquare-components';

export type UserRole = {
    id: number;
    name: string;
    created_at: string;
    updated_at?: string;
};
export type UserRolesFilterParams = {
    name?: string;
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
