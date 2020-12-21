import React from 'react';
import { MuiThemeProvider } from '@material-ui/core/styles';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import MomentUtils from '@date-io/moment';

import theme from '../../apps/Iaso/utils/theme';

export const renderWithMuiTheme = component => (
    <MuiThemeProvider theme={theme}>
        <MuiPickersUtilsProvider utils={MomentUtils}>
            {component}
        </MuiPickersUtilsProvider>
    </MuiThemeProvider>
);
