import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

import { theme } from 'bluesquare-components';

export const renderWithMuiTheme = component => (
    <ThemeProvider theme={theme}>
        <LocalizationProvider adapterLocale={AdapterDayjs}>
            {component}
        </LocalizationProvider>
    </ThemeProvider>
);
