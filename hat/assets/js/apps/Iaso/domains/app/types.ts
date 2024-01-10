import { IntlMessage } from 'bluesquare-components';
import { ElementType, ReactNode } from 'react';

export type RouteParam = {
    isRequired: boolean;
    key: string;
};

export type RouteCustom = {
    baseUrl: string;
    permissions?: string[];
    params: RouteParam[];
    allowAnonymous?: boolean;
    isRootUrl?: boolean;
    // eslint-disable-next-line no-unused-vars
    component: (props: any) => ReactNode;
};

export type MenuItem = {
    label: IntlMessage | string;
    key: string;
    permissions: string[];
    subMenu?: MenuItem[];
    // eslint-disable-next-line no-unused-vars
    component: (props: any) => ReactNode;
};

export type Plugin = {
    routes: RouteCustom[];
    menu: MenuItem[];
    translations: Record<string, any>;
    homeUrl?: string;
    homeOnline?: ElementType;
    homeOffline?: ElementType;
    key?: string;
};

export type Plugins = {
    plugins: Plugin[];
};
