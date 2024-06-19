import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from 'bluesquare-components';
import React from 'react';
import ReactDOM from 'react-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Provider } from 'react-redux';

import './libs/polyfills';

import { GlobalStyles } from '@mui/material';
import { SidebarProvider } from './domains/app/contexts/SideBarContext';
import {
    ThemeConfig,
    ThemeConfigContext,
} from './domains/app/contexts/ThemeConfigContext';
import App from './domains/app/index';
import { Plugin } from './domains/app/types';
import { store } from './redux/store.js';
import { getGlobalOverrides, getOverriddenTheme } from './styles';
import { PluginsContext, getPlugins } from './utils';

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
                        <SidebarProvider>
                            <Provider store={store}>
                                <App
                                    userHomePage={
                                        pluginHomePage || userHomePage
                                    }
                                />
                            </Provider>
                        </SidebarProvider>
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
