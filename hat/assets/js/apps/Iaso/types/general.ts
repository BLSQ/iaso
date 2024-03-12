import { SxProps, Theme } from '@mui/material';
import { GenericObject, Optional } from './utils';

export type PostArg = {
    url: string;
    data: Record<string, any>;
    fileData?: Record<string, Blob | Blob[]>;
    signal?: AbortSignal | null;
};

export type SxStyles = Record<string, SxProps<Theme>>;

export type Locale = {
    code: string;
    label: string;
};

export type RouterLocation = {
    action: string; // Probably "REDIRECT" or "REPLACE"
    basename: string; // eg "/dashboard"
    hash: string;
    key: string;
    pathname: string; // eg /entities/duplicates/accountId/1
    query: GenericObject;
    search: string;
    state?: any;
};

export type Router = {
    // eslint-disable-next-line no-unused-vars
    createHref: (location: any) => unknown;
    createkey: () => unknown;
    // eslint-disable-next-line no-unused-vars
    createLocation: (location: any) => unknown;
    // eslint-disable-next-line no-unused-vars
    createPath: (location: any) => unknown;
    getCurrentLocation: () => unknown;
    // eslint-disable-next-line no-unused-vars
    go: (value: unknown) => unknown;
    goBack: () => unknown;
    goForward: () => unknown;
    // eslint-disable-next-line no-unused-vars
    isActive: (location: unknown, indexOnly: unknown) => unknown;
    // eslint-disable-next-line no-unused-vars
    listen: (listener: unknown) => unknown;
    // eslint-disable-next-line no-unused-vars
    listenBefore: (hook: unknown) => unknown;
    location: RouterLocation;
    params: Record<string, Optional<string>>;
    // eslint-disable-next-line no-unused-vars
    setRouteLeaveHook: (route: unknown, hook: unknown) => unknown;
    // eslint-disable-next-line no-unused-vars
    transitionTo: (nextLocation: unknown) => unknown;
    unsubscribe: () => unknown;
};

export type PaginationParams = {
    pageSize: string;
    order: string;
    page: string;
};

declare global {
    interface Window {
        STATIC_URL?: string;
    }
}

export type ColumnCell<T> = { row: { original: T; index: number } };
