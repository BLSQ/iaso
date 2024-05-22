import { ElementType, ReactNode } from 'react';
import { IntlMessage } from 'bluesquare-components';
import {
    Redirection as RoutingRedirection,
    RouteCustom,
} from '../../routing/types';

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

// TODO deprecate or update to react-router 6
export type Redirection = {
    path: string;
    // eslint-disable-next-line no-unused-vars
    component: (args: any) => ReactNode;
};

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
    redirections?: RoutingRedirection[];
};

export type Plugins = {
    plugins: Plugin[];
};
