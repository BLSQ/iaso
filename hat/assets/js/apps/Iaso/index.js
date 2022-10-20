import React from 'react';
import ReactDOM from 'react-dom';
import { Route } from 'react-router';
import { MuiThemeProvider } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import { theme } from 'bluesquare-components';
import { QueryClient, QueryClientProvider } from 'react-query';
import App from './domains/app';
import { routeConfigs, getPath } from './constants/routes';
import ProtectedRoute from './domains/users/components/ProtectedRoute';
import { store, history } from './redux/store';
import { addRoutes } from './routing/redirections';
import { getPlugins, PluginsContext } from './utils';
import { getOverriddenTheme } from './styles';
import { ThemeConfigContext } from './domains/app/contexts/ThemeConfigContext.tsx';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
        },
    },
});

export default function iasoApp(
    element,
    enabledPluginsName,
    themeConfig,
    userHomePage,
) {
    const plugins = getPlugins(enabledPluginsName);
    const allRoutesConfigs = [
        ...routeConfigs,
        ...plugins.map(plugin => plugin.routes).flat(),
    ];
    const baseRoutes = allRoutesConfigs.map(routeConfig => {
        const { allowAnonymous, component } = routeConfig;
        const renderProtectedComponent = props => (
            <ProtectedRoute
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...props}
                routeConfig={routeConfig}
                component={routeConfig.component(props)}
                allRoutes={allRoutesConfigs}
            />
        );
        const page = allowAnonymous ? component : renderProtectedComponent;
        return <Route path={getPath(routeConfig)} component={page} />;
    });

    const overrideLandingRoutes = plugins
        .filter(plugin => plugin.overrideLanding)
        .map(plugin => plugin.overrideLanding);
    // using the last plugin override (arbitrary choice)
    const overrideLanding =
        overrideLandingRoutes.length > 0
            ? overrideLandingRoutes[overrideLandingRoutes.length - 1]
            : undefined;
    const routes = addRoutes(baseRoutes, userHomePage || overrideLanding);
    ReactDOM.render(
        <QueryClientProvider client={queryClient}>
            <PluginsContext.Provider value={{ plugins }}>
                <ThemeConfigContext.Provider value={themeConfig}>
                    <MuiThemeProvider
                        theme={getOverriddenTheme(theme, themeConfig)}
                    >
                        <CssBaseline />
                        <App store={store} routes={routes} history={history} />
                    </MuiThemeProvider>
                </ThemeConfigContext.Provider>
            </PluginsContext.Provider>
        </QueryClientProvider>,
        element,
    );
}

// Before we were exporting the function and using the iaso as a proper lib
// but it was proken by webbpack-dev-server injecting his code so this a replacement
// solution

window.iasoApp = iasoApp;
