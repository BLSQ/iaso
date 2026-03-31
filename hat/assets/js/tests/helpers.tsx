import React from 'react';
import { GlobalStyles } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { render, RenderOptions } from '@testing-library/react';
import { theme } from 'bluesquare-components';
import { LANGUAGE_CONFIGS } from 'IasoModules/language/configs';
import moment from 'moment/moment';
import { QueryClient, QueryClientProvider } from 'react-query';
import { getGlobalOverrides } from 'Iaso/styles';

export const setLocale = (code: string): void => {
    moment.locale(code);
    moment.updateLocale(code, {
        longDateFormat:
            LANGUAGE_CONFIGS[code]?.dateFormats ||
            LANGUAGE_CONFIGS.en?.dateFormats ||
            {},
        week: {
            dow: 1,
        },
    });
};

const queryClient = new QueryClient();

export const QueryClientWrapper = ({
    children,
}: {
    children: React.ReactNode;
}) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);
function Wrapper({ children }: { children: React.ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <GlobalStyles styles={getGlobalOverrides(theme)} />
                {children}
            </ThemeProvider>
        </QueryClientProvider>
    );
}

export function renderWithTheme(
    ui: React.ReactElement,
    options?: RenderOptions,
) {
    return render(ui, {
        wrapper: Wrapper,
        ...options,
    });
}
