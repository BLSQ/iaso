import React from 'react';
import { GlobalStyles } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { render, RenderOptions } from '@testing-library/react';
import { screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { theme } from 'bluesquare-components';
import { LANGUAGE_CONFIGS } from 'IasoModules/language/configs';
import moment from 'moment/moment';
import { IntlProvider } from 'react-intl';
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

export const QueryClientWrapperWithIntlProvider = ({
    children,
}: {
    children: React.ReactNode;
}) => (
    <IntlProvider locale={'en'} messages={{}}>
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    </IntlProvider>
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

function IntlProviderThemeWrapper({ children }: { children: React.ReactNode }) {
    return (
        <IntlProvider locale={'en'} messages={{}}>
            <Wrapper>{children}</Wrapper>
        </IntlProvider>
    );
}
export function renderWithThemeAndIntlProvider(
    ui: React.ReactElement,
    options?: RenderOptions,
) {
    return render(ui, {
        wrapper: IntlProviderThemeWrapper,
        ...options,
    });
}

export const selectFromComboBoxWithAsync = async ({
    nameComboBox,
    nameOption,
}: {
    nameComboBox: string | RegExp;
    nameOption: string | RegExp;
}) => {
    let typingOption: string;
    if (typeof nameOption === 'string') {
        typingOption = nameOption.slice(0, 3);
    } else {
        typingOption = (nameOption as RegExp).source.slice(0, 3);
    }

    const user = userEvent.setup();

    const combobox = screen.getByRole('combobox', { name: nameComboBox });
    await act(async () => {
        await user.click(combobox);
        await user.type(combobox, typingOption);
    });

    await waitFor(
        () => {
            expect(
                screen.getByRole('option', { name: nameOption }),
            ).toBeInTheDocument();
        },
        { timeout: 3000 },
    );
    await act(async () => {
        await user.click(screen.getByRole('option', { name: nameOption }));
    });
};
