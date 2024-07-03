import React from 'react';
import {
    AnonymousRoutePath,
    RoutePath,
} from '../../../../../hat/assets/js/apps/Iaso/constants/routes';
import { Home } from '../domains/home';
import { Registry } from '../domains/registry';
import { baseUrls } from './urls';

export const homePath: AnonymousRoutePath = {
    baseUrl: baseUrls.home,
    routerUrl: `${baseUrls.home}/*`,
    element: <Home />,
    isRootUrl: true,
    allowAnonymous: true,
    useDashboard: false,
};

export const registryPath: AnonymousRoutePath = {
    baseUrl: baseUrls.registry,
    routerUrl: `${baseUrls.registry}/*`,
    element: <Registry />,
    isRootUrl: true,
    allowAnonymous: true,
    useDashboard: false,
};

export const routes: (RoutePath | AnonymousRoutePath)[] = [
    homePath,
    registryPath,
];
