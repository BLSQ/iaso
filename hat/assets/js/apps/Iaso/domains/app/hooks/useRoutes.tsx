import React, { ReactElement, useMemo } from 'react';
import { Route, Routes } from 'react-router';

import {
    routeConfigs as appRoutes,
    page404,
    setupAccountPath,
} from '../../../constants/routes';

import { baseUrls } from '../../../constants/urls';
import {
    useHomeOnlineComponent,
    useHomeOfflineComponent,
    usePluginsRouteConfigs,
} from '../../../plugins/hooks/routes';
import { useRedirections } from '../../../routing/hooks/useRedirections';
import { RouteCustom } from '../../../routing/types';
import { useCurrentUser, useHasNoAccount } from '../../../utils/usersUtils';
import ProtectedRoute from '../../users/components/ProtectedRoute';

type Result = {
    routes: ReactElement | null;
    nonDashboardRoutes: ReactElement | null;
    isCurrentRouteAnonymous: boolean;
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

export const useCurrentRoute = (
    routes: RouteCustom[],
): RouteCustom | undefined => {
    return useMemo(() => {
        return routes.find(route => {
            return (
                window.location.pathname.includes(`/${route.baseUrl}/`) ||
                window.location.pathname.endsWith(`/${route.baseUrl}`)
            );
        });
    }, [routes]);
};

const setupRoutes: RouteCustom[] = [setupAccountPath, page404];
type UseGetRouteConfigsArgs = {
    userHomePage?: string;
    pluginRoutes: RouteCustom[];
};
export const useGetRoutesConfigs = ({
    userHomePage,
    pluginRoutes,
}: UseGetRouteConfigsArgs): RouteCustom[] => {
    const currentUser = useCurrentUser();
    const hasNoAccount = useHasNoAccount();
    const homeOnlineRoute = useHomeOnlineRoute(userHomePage);
    const homeOfflineRoute = useHomeOfflineRoute();
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
    const { pluginRoutes, pluginRedirections } = usePluginsRouteConfigs();
    const routesConfigs = useGetRoutesConfigs({ userHomePage, pluginRoutes });
    const protectedRoutes = useGetProtectedRoutes(routesConfigs, hasNoAccount);
    const currentRoute = useCurrentRoute(routesConfigs);

    const isCurrentRouteAnonymous = Boolean(currentRoute?.allowAnonymous);
    const redirections = useRedirections({
        hasNoAccount,
        pluginRedirections,
        userHomePage,
        allowAnonymous: isCurrentRouteAnonymous,
    });
    // routes should protectedRoutes change if currentUser has changed
    const routes: ReactElement | null = useMemo(
        () => (
            <Routes>
                {[
                    ...protectedRoutes.filter(
                        route => route.props.useDashboard !== false,
                    ),
                    ...redirections,
                ]}
            </Routes>
        ),
        [protectedRoutes, redirections],
    );
    const nonDashboardRoutes: ReactElement | null = useMemo(
        () => (
            <Routes>
                {[
                    ...protectedRoutes.filter(
                        route => !route.props.useDashboard,
                    ),
                    ...redirections,
                ]}
            </Routes>
        ),
        [protectedRoutes, redirections],
    );
    return useMemo(
        () => ({
            routes,
            nonDashboardRoutes,
            isCurrentRouteAnonymous,
        }),
        [routes, nonDashboardRoutes, isCurrentRouteAnonymous],
    );
};
