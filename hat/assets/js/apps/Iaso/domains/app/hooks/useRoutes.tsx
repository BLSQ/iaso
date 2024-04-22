import React, { ElementType, useContext, useMemo, ReactElement } from 'react';
import { Route, Routes } from 'react-router';
import { last } from 'lodash';

import {
    routeConfigs as appRoutes,
    setupAccountPath,
    page404,
} from '../../../constants/routes';

import ProtectedRoute from '../../users/components/ProtectedRoute';
import { baseUrls } from '../../../constants/urls';
import { HomeOnline } from '../../home/HomeOnline';
import { PluginsContext } from '../../../utils';
import { Plugins, RouteCustom } from '../types';
import { useCurrentUser, useHasNoAccount } from '../../../utils/usersUtils';
import { useRedirections } from '../../../routing/hooks/useRedirections';
import { useGetAndStoreCurrentUser } from '../../home/hooks/useGetAndStoreCurrentUser';
import { SHOW_HOME_ONLINE, hasFeatureFlag } from '../../../utils/featureFlags';

type Result = {
    routes: ReactElement | null;
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

const useHomeOnlineRoute = (userHomePage?: string): RouteCustom[] => {
    const HomeComponent = useHomeOnlineComponent();
    if (!HomeComponent || userHomePage) {
        return [];
    }
    return [
        {
            baseUrl: baseUrls.home,
            routerUrl: `${baseUrls.home}/*`,
            permissions: [],
            allowAnonymous: false,
            element: <HomeComponent />,
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
            routerUrl: `${baseUrls.home}/*`,
            permissions: [],
            allowAnonymous: true,
            element: <HomeComponent />,
        },
    ];
};

// TODO fix plugin config
const usePluginsRoutes = (): RouteCustom[] => {
    const { plugins }: Plugins = useContext(PluginsContext);
    return plugins
        .map(plugin =>
            plugin.routes.map(route => {
                if (route.allowAnonymous) return route;
                return {
                    ...route,
                    params: ['accountId', ...route.params],
                };
            }),
        )
        .flat();
};

const useGetProtectedRoutes = (
    routes: RouteCustom[],
    hasNoAccount: boolean,
): ReactElement[] => {
    return useMemo(() => {
        return routes.map(routeConfig => {
            const { allowAnonymous = false, element: Component } = routeConfig;
            const ProtectedComponent = props => (
                <ProtectedRoute
                    {...props}
                    key={routeConfig.routerUrl}
                    routeConfig={routeConfig}
                    allRoutes={routes}
                    component={routeConfig.element}
                    hasNoAccount={hasNoAccount}
                />
            );
            const Page =
                allowAnonymous || hasNoAccount ? (
                    Component
                ) : (
                    <ProtectedComponent />
                );

            return (
                <Route
                    path={routeConfig.routerUrl}
                    element={Page}
                    key={routeConfig.routerUrl}
                />
            );
        });
    }, [hasNoAccount, routes]);
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
const useGetRoutesConfigs = (userHomePage?: string): RouteCustom[] => {
    const currentUser = useCurrentUser();
    const hasNoAccount = useHasNoAccount();
    const homeOnlineRoute = useHomeOnlineRoute(userHomePage);
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

export const useRoutes = (userHomePage?: string): Result => {
    const hasNoAccount = useHasNoAccount();
    const routesConfigs = useGetRoutesConfigs(userHomePage);

    const protectedRoutes = useGetProtectedRoutes(routesConfigs, hasNoAccount);
    const currentRoute = useCurrentRoute(routesConfigs);

    const { isFetching: isFetchingCurrentUser } = useGetAndStoreCurrentUser(
        !currentRoute?.allowAnonymous ||
            currentRoute?.baseUrl === baseUrls.home,
    );
    const redirections = useRedirections(
        hasNoAccount,
        isFetchingCurrentUser,
        userHomePage,
    );

    // routes should only change if currentUser has changed
    const routes: ReactElement | null = useMemo(
        () =>
            isFetchingCurrentUser ? null : (
                <Routes>{[...protectedRoutes, ...redirections]}</Routes>
            ),
        [isFetchingCurrentUser, protectedRoutes, redirections],
    );

    return useMemo(
        () => ({
            routes,
            isLoadingRoutes: isFetchingCurrentUser,
        }),
        [routes, isFetchingCurrentUser],
    );
};
