import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';

import { theme } from 'bluesquare-components';

export const renderWithMuiTheme = component => (
    <ThemeProvider theme={theme}>
        <LocalizationProvider adapterLocale={AdapterMoment}>
            {component}
        </LocalizationProvider>
    </ThemeProvider>
);
