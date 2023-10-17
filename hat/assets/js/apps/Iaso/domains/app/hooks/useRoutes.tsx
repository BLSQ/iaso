import React, { ElementType, useContext, useMemo, ReactElement } from 'react';
import { Route, Redirect } from 'react-router';
import { cloneDeep } from 'lodash';

import {
    routeConfigs,
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
import { getRedirections } from '../../../routing/redirections';
import { useGetAndStoreCurrentUser } from '../../home/hooks/useGetAndStoreCurrentUser';

type Result = {
    routes: ReactElement[];
    isLoadingRoutes: boolean;
};

export const useRoutes = (userHomePage: string | undefined): Result => {
    const hasNoAccount = useHasNoAccount();
    const { plugins }: Plugins = useContext(PluginsContext);
    // eslint-disable-next-line no-unused-vars
    const HomeComponent: ElementType = useMemo(() => {
        const homeComponents = plugins
            .filter(plugin => plugin.homeComponent)
            .map(plugin => plugin.homeComponent);
        // using the last plugin override (arbitrary choice)
        const component =
            homeComponents.length > 0
                ? homeComponents[homeComponents.length - 1]
                : // or use Iaso Home page
                  Home;
        return component;
    }, [plugins]);

    const routesWithAccount: RouteCustom[] = useMemo(
        () => [
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
            ...(routeConfigs as RouteCustom[]),
            ...plugins
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
                .flat(),
        ],
        [HomeComponent, plugins],
    );
    const allRoutesConfigs: RouteCustom[] = useMemo(
        () =>
            hasNoAccount
                ? ([setupAccountPath, page404] as RouteCustom[])
                : routesWithAccount,
        [hasNoAccount, routesWithAccount],
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
        const baseRoutes = allRoutesConfigs.map(routeConfig => {
            const { allowAnonymous = false, component } = routeConfig;
            const renderProtectedComponent = props => (
                <ProtectedRoute
                    // eslint-disable-next-line react/jsx-props-no-spreading
                    {...props}
                    routeConfig={routeConfig}
                    component={routeConfig.component(props)}
                    allRoutes={allRoutesConfigs}
                    hasNoAccount={hasNoAccount}
                />
            );
            const page =
                allowAnonymous || hasNoAccount
                    ? component
                    : renderProtectedComponent;
            return <Route path={getPath(routeConfig)} component={page} />;
        });
        return cloneDeep(baseRoutes).concat(
            getRedirections(hasNoAccount, userHomePage).map(redirection => {
                if (redirection.component) {
                    return (
                        <Route
                            path={redirection.path}
                            component={redirection.component}
                        />
                    );
                }
                return <Redirect path={redirection.path} to={redirection.to} />;
            }),
        );
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
