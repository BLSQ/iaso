import React from 'react';
import moment from 'moment/moment';
import { LANGUAGE_CONFIGS } from 'IasoModules/language/configs';
import { render, RenderOptions } from '@testing-library/react';
import { theme } from 'bluesquare-components';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { GlobalStyles } from '@mui/material';
import { getGlobalOverrides } from '../apps/Iaso/styles';

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


function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
        <GlobalStyles styles={getGlobalOverrides(theme)} />
      {children}
    </ThemeProvider>
  );
}

export function renderWithTheme(
  ui: React.ReactElement,
  options?: RenderOptions
) {
  return render(ui, {
    wrapper: Wrapper,
    ...options,
  });
}