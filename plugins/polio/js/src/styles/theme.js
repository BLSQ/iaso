import { createTheme } from '@material-ui/core/styles';
import { makeStyles } from '@material-ui/core';
import commonStyles from './common';

export const theme = createTheme({
    typography: {
        useNextVariants: true,
    },
    textColor: '#333',
    palette: {
        // primary: {
        //     main: '#82AE2E',
        //     dark: 'darken(#82AE2E, 50%)',
        //     contrastText: '#FFFFFF',
        // },
        // secondary: {
        //     main: '#EA622A',
        // },
        gray: {
            main: '#666',
        },
        mediumGray: {
            main: '#A2A2A2',
        },
        ligthGray: {
            main: '#F7F7F7',
            border: 'rgba(0, 0, 0, 0.12)',
            background: 'rgba(0, 0, 0, 0.012)',
        },
        error: {
            main: 'rgb(215, 25, 28)',
            background: 'rgba(215, 25, 28, 0.2)',
            backgroundHard: 'rgba(215, 25, 28, 0.7)',
        },
        success: {
            main: '#4caf50',
            background: 'rgba(#4caf50, 0.2)',
        },
    },
});

export const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    root: {
        flexGrow: 1,
    },
    table: {
        borderSpacing: 0,
        width: '100%',
        border: '1px solid rgba(0,0,0,0.1)',
    },
    tableHeader: {
        display: 'flex',
        boxShadow: '0 2px 15px 0 rgb(0 0 0 / 15%)',
    },
    tableRow: {
        display: 'flex',
    },
    pageActions: {
        marginBottom: theme.spacing(2),
    },
    pageAction: {
        marginRight: theme.spacing(1),
    },
    form: {
        marginTop: theme.spacing(4),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
    },
    round1FormCalculations: {
        marginTop: theme.spacing(4),
        marginBottom: theme.spacing(4),
    },
    input: {
        marginBottom: theme.spacing(2),
    },
    tabs: {
        borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
    },
}));
