/* eslint-disable react/jsx-props-no-spreading */
import { last } from 'lodash';
import React, { ElementType, ReactElement, useContext, useMemo } from 'react';
import { Route, Routes } from 'react-router';

import {
    routeConfigs as appRoutes,
    page404,
    setupAccountPath,
} from '../../../constants/routes';

import { baseUrls } from '../../../constants/urls';
import { useRedirections } from '../../../routing/hooks/useRedirections';
import { RouteCustom } from '../../../routing/types';
import { PluginsContext } from '../../../utils';
import { SHOW_HOME_ONLINE, hasFeatureFlag } from '../../../utils/featureFlags';
import { useCurrentUser, useHasNoAccount } from '../../../utils/usersUtils';
import { HomeOnline } from '../../home/HomeOnline';
import ProtectedRoute from '../../users/components/ProtectedRoute';
import { useGetCurrentUser } from '../../users/hooks/useGetCurrentUser';
import { Plugins } from '../types';

type Result = {
    routes: ReactElement | null;
    isLoadingRoutes: boolean;
    removeIasoRoutes: boolean | undefined;
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

const usePluginsRouteConfigs = (): {
    pluginRoutes: RouteCustom[];
    pluginRedirections: any[];
    removeIasoRoutes?: boolean;
} => {
    const { plugins }: Plugins = useContext(PluginsContext);
    const pluginRoutes = plugins.map(plugin => plugin.routes).flat();
    const pluginRedirections = plugins
        .map(plugin => plugin.redirections)
        .flat();
    const removeIasoRoutes = plugins.some(plugin => plugin.removeIasoRoutes);
    return useMemo(
        () => ({ pluginRoutes, pluginRedirections, removeIasoRoutes }),
        [pluginRedirections, pluginRoutes, removeIasoRoutes],
    );
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
            const props = {
                ...routeConfig,
                element: Page,
            };
            return (
                <Route
                    path={routeConfig.routerUrl}
                    key={routeConfig.routerUrl}
                    {...props}
                />
            );
        });
    }, [hasNoAccount, routes]);
};

const useCurrentRoute = (routes: RouteCustom[]): RouteCustom | undefined => {
    return useMemo(
        () =>
            routes.find(route => {
                return window.location.pathname.includes(route.baseUrl);
            }),
        [routes],
    );
};

const setupRoutes: RouteCustom[] = [setupAccountPath, page404];
type UseGetRouteConfigsArgs = {
    userHomePage?: string;
    pluginRoutes: RouteCustom[];
    removeIasoRoutes?: boolean;
};
const useGetRoutesConfigs = ({
    userHomePage,
    pluginRoutes,
    removeIasoRoutes,
}: UseGetRouteConfigsArgs): RouteCustom[] => {
    const currentUser = useCurrentUser();
    const hasNoAccount = useHasNoAccount();
    const homeOnlineRoute = useHomeOnlineRoute(userHomePage);
    const homeOfflineRoute = useHomeOfflineRoute();
    if (removeIasoRoutes) {
        if (currentUser) {
            return [...homeOnlineRoute, ...pluginRoutes];
        }
        return [
            ...homeOfflineRoute,
            ...pluginRoutes.filter(route => route.allowAnonymous),
        ];
    }
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
    const { pluginRoutes, pluginRedirections, removeIasoRoutes } =
        usePluginsRouteConfigs();
    const routesConfigs = useGetRoutesConfigs({
        userHomePage,
        pluginRoutes,
        removeIasoRoutes,
    });
    const protectedRoutes = useGetProtectedRoutes(routesConfigs, hasNoAccount);
    const currentRoute = useCurrentRoute(routesConfigs);

    const { isFetching: isFetchingCurrentUser } = useGetCurrentUser(
        !currentRoute?.allowAnonymous ||
            currentRoute?.baseUrl === baseUrls.home,
        false,
    );
    const redirections = useRedirections({
        hasNoAccount,
        isFetchingCurrentUser,
        pluginRedirections,
        userHomePage,
        allowAnonymous: Boolean(currentRoute?.allowAnonymous),
        removeIasoRoutes,
    });
    // routes should protectedRoutes change if currentUser has changed
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
            removeIasoRoutes,
        }),
        [routes, isFetchingCurrentUser, removeIasoRoutes],
    );
};
