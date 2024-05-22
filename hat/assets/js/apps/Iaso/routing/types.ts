import { ReactElement, ReactNode } from 'react';

export type Route = {
    path: string;
    element: ReactElement;
    errorElement?: ReactElement; // eg: ErrorBoundary
    // eslint-disable-next-line no-unused-vars
    action?: ({ request }) => any;
    // eslint-disable-next-line no-unused-vars
    loader?: ({ request, params }) => any;
};

export type RouteParam = {
    isRequired: boolean;
    key: string;
};

export type RouteCustom = {
    baseUrl: string;
    routerUrl: string;
    permissions?: string[];
    allowAnonymous?: boolean;
    isRootUrl?: boolean;
    // eslint-disable-next-line no-unused-vars
    element: ReactNode;
};

export type Redirection = {
    path: string; // origin url
    to: string; // destination url
};
