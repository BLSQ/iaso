import React, { ElementType, useContext, useMemo, ReactElement } from 'react';
import { Route } from 'react-router';
import { last } from 'lodash';

import {
    routeConfigs as appRoutes,
    getPath,
    setupAccountPath,
    page404,
} from '../../../constants/routes';

import ProtectedRoute from '../../users/components/ProtectedRoute';
import { baseUrls } from '../../../constants/urls';
import Home from '../../home';
import { PluginsContext } from '../../../utils';
import { Plugins, RouteCustom } from '../types';
import { useHasNoAccount } from '../../../utils/usersUtils';
import { useRedirections } from '../../../routing/useRedirections';
import { useGetAndStoreCurrentUser } from '../../home/hooks/useGetAndStoreCurrentUser';

type Result = {
    routes: ReactElement[];
    isLoadingRoutes: boolean;
};

const useHomeComponent = (): ElementType => {
    const { plugins }: Plugins = useContext(PluginsContext);
    // using the last plugin override (arbitrary choice)
    return useMemo(
        () =>
            last(
                plugins
                    .filter(plugin => plugin.homeComponent)
                    .map(plugin => plugin.homeComponent),
            ) || Home,
        [plugins],
    );
};

const useHomeRoute = (): RouteCustom[] => {
    const HomeComponent = useHomeComponent();
    return [
        {
            baseUrl: baseUrls.home,
            permissions: [],
            allowAnonymous: true,
            component: props => <HomeComponent {...props} />,
            params: [
                {
                    isRequired: false,
                    key: 'accountId',
                },
            ],
        },
    ];
};

const usePluginsRoutes = (): RouteCustom[] => {
    const { plugins }: Plugins = useContext(PluginsContext);
    return plugins
        .map(plugin =>
            plugin.routes.map(route => {
                if (route.allowAnonymous) return route;
                return {
                    ...route,
                    params: [
                        {
                            isRequired: false,
                            key: 'accountId',
                        },
                        ...route.params,
                    ],
                };
            }),
        )
        .flat();
};

const useGetProtectedRoutes = (
    routes: RouteCustom[],
    hasNoAccount: boolean,
): ReactElement[] => {
    return useMemo(
        () =>
            routes.map(routeConfig => {
                const { allowAnonymous = false, component } = routeConfig;
                const renderProtectedComponent = props => (
                    <ProtectedRoute
                        // eslint-disable-next-line react/jsx-props-no-spreading
                        {...props}
                        routeConfig={routeConfig}
                        component={routeConfig.component(props)}
                        allRoutes={routes}
                        hasNoAccount={hasNoAccount}
                    />
                );
                const page =
                    allowAnonymous || hasNoAccount
                        ? component
                        : renderProtectedComponent;
                return <Route path={getPath(routeConfig)} component={page} />;
            }),
        [hasNoAccount, routes],
    );
};

const setupRoutes: RouteCustom[] = [setupAccountPath, page404];

export const useRoutes = (userHomePage: string | undefined): Result => {
    const hasNoAccount = useHasNoAccount();
    const pluginRoutes = usePluginsRoutes();
    const homeRoute = useHomeRoute();
    const redirections = useRedirections(hasNoAccount, userHomePage);

    const allRoutesConfigs: RouteCustom[] = useMemo(
        () =>
            hasNoAccount
                ? setupRoutes
                : [...homeRoute, ...appRoutes, ...pluginRoutes],
        [hasNoAccount, homeRoute, pluginRoutes],
    );

    const protectedRoutes = useGetProtectedRoutes(
        allRoutesConfigs,
        hasNoAccount,
    );

    const currentRoute: RouteCustom | undefined = useMemo(
        () =>
            allRoutesConfigs.find(route =>
                window.location.pathname.includes(`/${route.baseUrl}/`),
            ),
        [allRoutesConfigs],
    );

    const { data: currentUser, isFetching: isFetchingCurrentUser } =
        useGetAndStoreCurrentUser(
            !currentRoute?.allowAnonymous ||
                currentRoute?.baseUrl === baseUrls.home,
        );

    // routes should only change id currentUser has changed
    const routes: ReactElement[] = useMemo(() => {
        if (!currentUser && !currentRoute?.allowAnonymous) {
            return [];
        }
        return [...protectedRoutes, ...redirections];
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser, hasNoAccount]);

    const isLoadingRoutes =
        ((!currentUser || routes.length === 0) &&
            !currentRoute?.allowAnonymous) ||
        (isFetchingCurrentUser && currentRoute?.baseUrl === baseUrls.home);

    return useMemo(
        () => ({
            routes,
            isLoadingRoutes,
        }),
        [routes, isLoadingRoutes],
    );
};
