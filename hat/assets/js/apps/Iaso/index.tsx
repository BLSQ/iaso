import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from 'bluesquare-components';
import { QueryClient, QueryClientProvider } from 'react-query';

import './libs/polyfills';

import { GlobalStyles } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import App from './domains/app/index';
import { store, history } from './redux/store.js';
import { getPlugins, PluginsContext } from './utils';
import { getOverriddenTheme, getGlobalOverrides } from './styles';
import {
    ThemeConfig,
    ThemeConfigContext,
} from './domains/app/contexts/ThemeConfigContext';
import LocalizedAppComponent from './domains/app/components/LocalizedAppComponent.js';
import { Plugin } from './domains/app/types';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
        },
    },
});

declare global {
    interface Window {
        iasoApp: (
            // eslint-disable-next-line no-unused-vars
            element: HTMLElement,
            // eslint-disable-next-line no-unused-vars
            enabledPluginsName: string[],
            // eslint-disable-next-line no-unused-vars
            themeConfig: ThemeConfig,
            // eslint-disable-next-line no-unused-vars
            userHomePage: string,
        ) => void;
    }
}

const iasoApp = (element, enabledPluginsName, themeConfig, userHomePage) => {
    const plugins: Plugin[] = getPlugins(enabledPluginsName);
    // Arbitrarily take the home page of the first plugin in the list
    const pluginHomePage = plugins.map(plugin => plugin.homeUrl)[0];
    ReactDOM.render(
        <QueryClientProvider client={queryClient}>
            <PluginsContext.Provider value={{ plugins }}>
                <ThemeConfigContext.Provider value={themeConfig}>
                    <ThemeProvider
                        theme={getOverriddenTheme(theme, themeConfig)}
                    >
                        <CssBaseline />
                        <GlobalStyles styles={getGlobalOverrides(theme)} />
                        <Provider store={store}>
                            <LocalizedAppComponent>
                                <SnackbarProvider
                                    maxSnack={3}
                                    autoHideDuration={4000}
                                    anchorOrigin={{
                                        vertical: 'bottom',
                                        horizontal: 'center',
                                    }}
                                >
                                    <App
                                        history={history}
                                        userHomePage={
                                            pluginHomePage || userHomePage
                                        }
                                    />
                                </SnackbarProvider>
                            </LocalizedAppComponent>
                        </Provider>
                    </ThemeProvider>
                </ThemeConfigContext.Provider>
            </PluginsContext.Provider>
        </QueryClientProvider>,
        element,
    );
};

// Before we were exporting the function and using the iaso as a proper lib
// but it was proken by webbpack-dev-server injecting his code so this a replacement
// solution

window.iasoApp = iasoApp;
