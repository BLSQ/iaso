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

const queryClient = new QueryClient();

export default function iasoApp(element, enabledPluginsName) {
    const plugins = getPlugins(enabledPluginsName);
    const allRoutesConfigs = [
        ...routeConfigs,
        ...plugins.map(plugin => plugin.routes).flat(),
    ];
    const baseRoutes = allRoutesConfigs.map(routeConfig => (
        <Route
            path={getPath(routeConfig)}
            component={props => (
                <ProtectedRoute
                    {...props}
                    featureFlag={routeConfig.featureFlag}
                    permission={routeConfig.permission}
                    component={routeConfig.component(props)}
                    isRootUrl={routeConfig.isRootUrl}
                />
            )}
        />
    ));
    const routes = addRoutes(baseRoutes);

    ReactDOM.render(
        <QueryClientProvider client={queryClient}>
            <PluginsContext.Provider value={{ plugins }}>
                <MuiThemeProvider theme={theme}>
                    <CssBaseline />
                    <App store={store} routes={routes} history={history} />
                </MuiThemeProvider>
            </PluginsContext.Provider>
        </QueryClientProvider>,
        element,
    );
}

// Before we were exporting the function and using the iaso as a proper lib
// but it was proken by webbpack-dev-server injecting his code so this a replacement
// solution
window.iasoApp = iasoApp;
