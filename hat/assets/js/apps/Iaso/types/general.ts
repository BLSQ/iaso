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
    createHref: (location: any) => unknown;
    createkey: () => unknown;
    createLocation: (location: any) => unknown;
    createPath: (location: any) => unknown;
    getCurrentLocation: () => unknown;
    go: (value: unknown) => unknown;
    goBack: () => unknown;
    goForward: () => unknown;
    isActive: (location: unknown, indexOnly: unknown) => unknown;
    listen: (listener: unknown) => unknown;
    listenBefore: (hook: unknown) => unknown;
    location: RouterLocation;
    params: Record<string, Optional<string>>;
    setRouteLeaveHook: (route: unknown, hook: unknown) => unknown;
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
        IASO_VERSION?: string;
    }
}

export type ColumnCell<T> = { row: { original: T; index: number } };

export type OptionsResponse = {
    name: string;
    renders: string[];
    parses: string[];
    actions: {
        POST: Record<
            string,
            {
                type: 'integer' | 'field' | 'string' | 'choice';
                required: boolean;
                read_only: boolean;
                choices: { value: string; display_name: string }[];
            }
        >;
    };
};

export type UuidAsString = string;

export type DjangoError = Error & {
    /**
     * Non-field-specific validation errors returned by Django REST Framework
     */
    non_field_errors?: string[];
    /**
     * Field-specific validation errors
     */
    [key: string]: any;
};
