import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from 'bluesquare-components';
import { QueryClient, QueryClientProvider } from 'react-query';

import './libs/polyfills.ts';

import App from './domains/app';
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
                    <ThemeProvider
                        theme={getOverriddenTheme(theme, themeConfig)}
                    >
                        <CssBaseline />
                        <Provider store={store}>
                            <App
                                history={history}
                                userHomePage={userHomePage}
                            />
                        </Provider>
                    </ThemeProvider>
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
