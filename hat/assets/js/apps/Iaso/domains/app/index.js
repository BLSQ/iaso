import React, { useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Router, Link, Route } from 'react-router';
import { SnackbarProvider } from 'notistack';
import { LinkProvider } from 'bluesquare-components';
import SnackBarContainer from '../../components/snackBars/SnackBarContainer';
import LocalizedApp from './components/LocalizedAppComponent';

import { getRoutes } from '../../routing/redirections.tsx';
import { useHasNoAccount } from '../../utils/usersUtils.ts';

import {
    routeConfigs,
    getPath,
    setupAccountPath,
    page404,
} from '../../constants/routes';

import ProtectedRoute from '../users/components/ProtectedRoute';
import Home from '../home/index.tsx';
import { baseUrls } from '../../constants/urls';
import { useGetCurrentUser } from '../home/hooks/useGetCurrentUser.ts';
import { dispatch } from '../../redux/store';
import { redirectToReplace } from '../../routing/actions';

const getBaseRoutes = (plugins, hasNoAccount, HomeComponent) => {
    const routesWithAccount = [
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
    const allRoutesConfigs = hasNoAccount
        ? [setupAccountPath, page404]
        : routesWithAccount;
    const baseRoutes = allRoutesConfigs.map(routeConfig => {
        const { allowAnonymous, component } = routeConfig;
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
    return {
        baseRoutes,
        currentRoute: allRoutesConfigs.find(route =>
            window.location.pathname.includes(`/${route.baseUrl}/`),
        ),
    };
};

export default function App({ history, userHomePage, plugins }) {
    // const dispatch = useDispatch();
    // on first load this is undefined, it will be updated when fetchCurrentUser is done

    const hasNoAccount = useHasNoAccount();

    const HomeComponent = useMemo(() => {
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

    const { baseRoutes, currentRoute } = useMemo(
        () => getBaseRoutes(plugins, hasNoAccount, HomeComponent),
        [plugins, hasNoAccount, HomeComponent],
    );
    const { data: currentUser, isFetching: isFetchingCurrentUser } =
        useGetCurrentUser(
            !currentRoute?.allowAnonymous ||
                currentRoute?.baseUrl === baseUrls.home,
        );
    // routes should only change id currentUser has changed
    const routes = useMemo(() => {
        if (!currentUser && !currentRoute?.allowAnonymous) {
            return [];
        }
        return getRoutes(baseRoutes, hasNoAccount, userHomePage);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser, hasNoAccount]);

    // Redirect on load if user specify a home url in his profile
    useEffect(() => {
        if (
            userHomePage &&
            userHomePage !== '' &&
            window.location.pathname.includes(`/${baseUrls.home}/`)
        ) {
            dispatch(redirectToReplace(userHomePage));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (
        ((!currentUser || routes.length === 0) &&
            !currentRoute?.allowAnonymous) ||
        (isFetchingCurrentUser && currentRoute?.baseUrl === baseUrls.home)
    )
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
