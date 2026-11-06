import { ReactElement, ReactNode } from 'react';

export type Route = {
    path: string;
    element: ReactElement;
    errorElement?: ReactElement; // eg: ErrorBoundary
    action?: ({ request }) => any;
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
    element: ReactNode;
    featureFlag?: string;
    // Incomplete page: redirects to the work in progress page unless SHOW_DEV_FEATURES is active
    dev?: boolean;
    plannedRelease?: string;
};

export type Redirection = {
    path: string; // origin url
    to: string; // destination url
};

export type Url = string;
