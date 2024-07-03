import React from 'react';
import {
    AnonymousRoutePath,
    RoutePath,
} from '../../../../../hat/assets/js/apps/Iaso/constants/routes';
import { Home } from '../domains/home';
import { baseUrls } from './urls';

// We store the path in a variable so we can import it and use its permissions
export const homePath: RoutePath = {
    baseUrl: baseUrls.home,
    routerUrl: `${baseUrls.home}/*`,
    element: <Home />,
    permissions: [],
    isRootUrl: true,
};

export const routes: (RoutePath | AnonymousRoutePath)[] = [homePath];
