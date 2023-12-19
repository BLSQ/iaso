import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';

import { theme } from 'bluesquare-components';
import { getOverriddenTheme } from '../../apps/Iaso/styles';

export const renderWithMuiTheme = component => (
    <ThemeProvider
        theme={getOverriddenTheme(theme, {
            APP_TITLE: 'IASO',
            THEME_PRIMARY_COLOR: '#007DBC',
            THEME_SECONDARY_COLOR: '#eff2f5',
            THEME_PRIMARY_BACKGROUND_COLOR: '#eff2f5',
        })}
    >
        <LocalizationProvider dateAdapter={AdapterMoment} adapterLocale="en">
            {component}
        </LocalizationProvider>
    </ThemeProvider>
);
