import React from 'react';
import ReactDOM from 'react-dom';
// import { Route } from 'react-router';
import { Provider } from 'react-redux';
import { MuiThemeProvider } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import { theme } from 'bluesquare-components';
import { QueryClient, QueryClientProvider } from 'react-query';
import App from './domains/app';
// import { routeConfigs, getPath } from './constants/routes';
// import ProtectedRoute from './domains/users/components/ProtectedRoute';
import { store, history } from './redux/store';
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
    ReactDOM.render(
        <QueryClientProvider client={queryClient}>
            <PluginsContext.Provider value={{ plugins }}>
                <ThemeConfigContext.Provider value={themeConfig}>
                    <MuiThemeProvider
                        theme={getOverriddenTheme(theme, themeConfig)}
                    >
                        <CssBaseline />
                        <Provider store={store}>
                            <App
                                store={store}
                                plugins={plugins}
                                history={history}
                                userHomePage={userHomePage}
                            />
                        </Provider>
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
