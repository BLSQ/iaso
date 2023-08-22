import React, { useMemo, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { Router, Link, Route } from 'react-router';
import { SnackbarProvider } from 'notistack';
import { LinkProvider } from 'bluesquare-components';
import SnackBarContainer from '../../components/snackBars/SnackBarContainer';
import LocalizedApp from './components/LocalizedAppComponent';

import { getRoutes } from '../../routing/redirections.tsx';
import { useCurrentUser, useIsAdminNoAccount } from '../../utils/usersUtils.ts';
import { fetchCurrentUser } from '../users/actions';

import {
    routeConfigs,
    getPath,
    setupAccountPath,
    page404,
} from '../../constants/routes';

import ProtectedRoute from '../users/components/ProtectedRoute';

const getBaseRoutes = (plugins, isAdminNoAccount) => {
    const routesWithAccount = [
        ...routeConfigs,
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
    ];
    const allRoutesConfigs = isAdminNoAccount
        ? [setupAccountPath, page404]
        : routesWithAccount;
    return {
        baseRoutes: allRoutesConfigs.map(routeConfig => {
            const { allowAnonymous, component } = routeConfig;
            const renderProtectedComponent = props => (
                <ProtectedRoute
                    // eslint-disable-next-line react/jsx-props-no-spreading
                    {...props}
                    routeConfig={routeConfig}
                    component={routeConfig.component(props)}
                    allRoutes={allRoutesConfigs}
                    isAdminNoAccount={isAdminNoAccount}
                />
            );
            const page =
                allowAnonymous || isAdminNoAccount
                    ? component
                    : renderProtectedComponent;
            return <Route path={getPath(routeConfig)} component={page} />;
        }),
        currentRoute: allRoutesConfigs.find(route =>
            window.location.pathname.includes(`/${route.baseUrl}/`),
        ),
    };
};

export default function App({ history, userHomePage, plugins }) {
    const dispatch = useDispatch();
    // on first load this is undefined, it will be updated when fetchCurrentUser is done
    const currentUser = useCurrentUser();
    const isAdminNoAccount = useIsAdminNoAccount();
    const { baseRoutes, currentRoute } = useMemo(
        () => getBaseRoutes(plugins, isAdminNoAccount),
        [plugins, isAdminNoAccount],
    );

    // launch fetch user only once on mount
    useEffect(() => {
        if (!currentRoute?.allowAnonymous) {
            dispatch(fetchCurrentUser());
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dispatch]);
    const overrideLanding = useMemo(() => {
        const overrideLandingRoutes = plugins
            .filter(plugin => plugin.overrideLanding)
            .map(plugin => plugin.overrideLanding);
        // using the last plugin override (arbitrary choice)
        return overrideLandingRoutes.length > 0
            ? overrideLandingRoutes[overrideLandingRoutes.length - 1]
            : undefined;
    }, [plugins]);
    // routes should only change id currentUser has changed
    const routes = useMemo(() => {
        if (!currentUser && !currentRoute?.allowAnonymous) {
            return [];
        }
        return getRoutes(
            baseRoutes,
            userHomePage || overrideLanding,
            isAdminNoAccount,
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser, isAdminNoAccount]);

    if ((!currentUser || routes.length === 0) && !currentRoute?.allowAnonymous)
        return null;
    return (
        <LocalizedApp>
            <LinkProvider linkComponent={Link}>
                <SnackbarProvider
                    maxSnack={3}
                    autoHideDuration={4000}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'center',
                    }}
                >
                    <SnackBarContainer />
                    <Router routes={routes} history={history} />
                </SnackbarProvider>
            </LinkProvider>
        </LocalizedApp>
    );
}
App.defaultProps = {
    userHomePage: undefined,
};

App.propTypes = {
    plugins: PropTypes.array.isRequired,
    history: PropTypes.object.isRequired,
    userHomePage: PropTypes.string,
};
