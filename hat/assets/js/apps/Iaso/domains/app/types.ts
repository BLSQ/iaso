import { ElementType, ReactNode } from 'react';
import { IntlMessage } from 'bluesquare-components';

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

export type MenuItem = {
    label: string | IntlMessage;
    permissions?: string[];
    key?: string;
    mapKey?: string;
    // eslint-disable-next-line no-unused-vars
    icon?: (props: Record<string, any>) => ReactNode;
    subMenu?: MenuItems;
    extraPath?: string;
    url?: string;
    // eslint-disable-next-line no-unused-vars
    isActive?: (pathname: string) => boolean;
    dev?: boolean;
};
export type MenuItems = MenuItem[];

export type Plugin = {
    routes: RouteCustom[];
    menu: MenuItem[];
    translations: Record<string, any>;
    homeUrl?: string;
    homeOnline?: ElementType;
    homeOffline?: ElementType;
    key?: string;
    baseUrls: Record<string, string>;
    paramsConfig: Record<string, string[]>;
};

export type Plugins = {
    plugins: Plugin[];
};
