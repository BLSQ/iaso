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
import { HomeOnline } from '../../home/HomeOnline';
import { PluginsContext } from '../../../utils';
import { Plugins, RouteCustom } from '../types';
import { useCurrentUser, useHasNoAccount } from '../../../utils/usersUtils';
import { useRedirections } from '../../../routing/useRedirections';
import { useGetAndStoreCurrentUser } from '../../home/hooks/useGetAndStoreCurrentUser';
import { SHOW_HOME_ONLINE, hasFeatureFlag } from '../../../utils/featureFlags';

type Result = {
    routes: ReactElement[];
    isLoadingRoutes: boolean;
};

const useHomeOnlineComponent = (): ElementType | undefined => {
    const { plugins }: Plugins = useContext(PluginsContext);
    const currentUser = useCurrentUser();
    const canShowHome = hasFeatureFlag(currentUser, SHOW_HOME_ONLINE);
    const PluginHome = last(
        plugins
            .filter(plugin => plugin.homeOnline)
            .map(plugin => plugin.homeOnline),
    );
    // using the last plugin override (arbitrary choice)
    return useMemo(
        () => (canShowHome ? PluginHome || HomeOnline : undefined),
        [PluginHome, canShowHome],
    );
};
export const useHomeOfflineComponent = (): ElementType | undefined => {
    const { plugins }: Plugins = useContext(PluginsContext);
    // using the last plugin override (arbitrary choice)
    return useMemo(
        () =>
            last(
                plugins
                    .filter(plugin => plugin.homeOffline)
                    .map(plugin => plugin.homeOffline),
            ),
        [plugins],
    );
};

const useHomeUrl = (): string | undefined => {
    const { plugins }: Plugins = useContext(PluginsContext);
    // using the last plugin override (arbitrary choice)
    return useMemo(
        () =>
            last(
                plugins
                    .filter(plugin => plugin.homeUrl)
                    .map(plugin => plugin.homeUrl),
            ),
        [plugins],
    );
};

const useHomeOnlineRoute = (): RouteCustom[] => {
    const HomeComponent = useHomeOnlineComponent();
    if (!HomeComponent) {
        return [];
    }
    return [
        {
            baseUrl: baseUrls.home,
            permissions: [],
            allowAnonymous: false,
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
export const useHomeOfflineRoute = (): RouteCustom[] => {
    const HomeComponent = useHomeOfflineComponent();
    if (!HomeComponent) {
        return [];
    }
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

const useCurrentRoute = (routes: RouteCustom[]): RouteCustom | undefined => {
    return useMemo(
        () =>
            routes.find(route =>
                window.location.pathname.includes(`/${route.baseUrl}/`),
            ),
        [routes],
    );
};

const setupRoutes: RouteCustom[] = [setupAccountPath, page404];
const useGetRoutesConfigs = (): RouteCustom[] => {
    const currentUser = useCurrentUser();
    const hasNoAccount = useHasNoAccount();
    const homeOnlineRoute = useHomeOnlineRoute();
    const homeOfflineRoute = useHomeOfflineRoute();
    const pluginRoutes = usePluginsRoutes();
    if (hasNoAccount) {
        return setupRoutes;
    }
    if (currentUser) {
        return [...homeOnlineRoute, ...appRoutes, ...pluginRoutes];
    }
    return [
        ...homeOfflineRoute,
        ...appRoutes.filter(route => route.allowAnonymous),
        ...pluginRoutes.filter(route => route.allowAnonymous),
    ];
};

export const useRoutes = (userHomePage: string | undefined): Result => {
    const hasNoAccount = useHasNoAccount();
    const homeUrl = useHomeUrl();
    const routesConfigs = useGetRoutesConfigs();

    const protectedRoutes = useGetProtectedRoutes(routesConfigs, hasNoAccount);
    const currentRoute = useCurrentRoute(routesConfigs);

    const { isFetching: isFetchingCurrentUser } = useGetAndStoreCurrentUser(
        !currentRoute?.allowAnonymous ||
            currentRoute?.baseUrl === baseUrls.home,
    );
    const redirections = useRedirections(
        hasNoAccount,
        isFetchingCurrentUser,
        userHomePage || homeUrl,
    );

    // routes should only change if currentUser has changed
    const routes: ReactElement[] = useMemo(
        () =>
            isFetchingCurrentUser ? [] : [...protectedRoutes, ...redirections],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [isFetchingCurrentUser],
    );

    return useMemo(
        () => ({
            routes,
            isLoadingRoutes: isFetchingCurrentUser,
        }),
        [routes, isFetchingCurrentUser],
    );
};
