import { ReactNode } from 'react';
import { IntlMessage } from 'bluesquare-components';

export type MenuItem = {
    label: string | IntlMessage;
    permissions?: string[];
    key?: string;
    mapKey?: string;
    icon?: (props: Record<string, any>) => ReactNode;
    subMenu?: MenuItems;
    extraPath?: string;
    url?: string;
    isActive?: (pathname: string) => boolean;
    dev?: boolean;
    featureFlag?: string;
    // Small label shown after the item's name, e.g. "Beta"
    badge?: string | IntlMessage;
};
export type MenuItems = MenuItem[];

// TODO deprecate or update to react-router 6
export type Redirection = {
    path: string;
    component: (args: any) => ReactNode;
};

export type PaginatedResponse<T> = {
    hasPrevious?: boolean;
    hasNext?: boolean;
    count?: number;
    page?: number;
    pages?: number;
    limit?: number;
    results?: T[];
};
