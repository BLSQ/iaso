import React from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from 'bluesquare-components';
import ReactDOM from 'react-dom';
import { QueryClient, QueryClientProvider } from 'react-query';

import './libs/polyfills';

import { GlobalStyles } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import LocalizedAppComponent from './domains/app/components/LocalizedAppComponent';
import { LocaleProvider } from './domains/app/contexts/LocaleContext';
import { SentryConfig } from './domains/app/contexts/SentryProvider';
import { SidebarProvider } from './domains/app/contexts/SideBarContext';
import {
    ThemeConfig,
    ThemeConfigContext,
} from './domains/app/contexts/ThemeConfigContext';
import App from './domains/app/index';
import { Plugin } from './domains/app/types';
import { getGlobalOverrides, getOverriddenTheme } from './styles';
import { PluginsContext, getPlugins } from './utils';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            keepPreviousData: true,
            cacheTime: 60000,
        },
    },
});

declare global {
    interface Window {
        SENTRY_CONFIG?: SentryConfig;
        SENTRY_INITIALIZED?: boolean;
        PRODUCT_FRUITS_WORKSPACE_CODE?: string;
        iasoApp: (
            element: HTMLElement,
            enabledPluginsName: string[],
            themeConfig: ThemeConfig,
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
                            <LocaleProvider>
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
                                            userHomePage={
                                                pluginHomePage || userHomePage
                                            }
                                        />
                                    </SnackbarProvider>
                                </LocalizedAppComponent>
                            </LocaleProvider>
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
