/* eslint-disable camelcase */
import { ReactElement } from 'react';

export type Column = {
    Header: string;
    id?: string;
    accessor?: string;
    sortable?: boolean;
    resizable?: boolean;
    width?: number;
    // eslint-disable-next-line no-unused-vars
    Cell?: (s: any) => ReactElement;
    align?: string;
};
export type Pagination = {
    pages: number;
    page: number;
    count: number;
    limit: number;
    has_next: boolean;
    has_previous: boolean;
};

export type UrlParams = {
    pageSize: string;
    order: string;
    page: string;
    search?: string;
};

export type ApiParams = {
    limit: string;
    order: string;
    page: string;
    search?: string;
};
