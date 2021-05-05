import { createMuiTheme } from '@material-ui/core/styles';

export const theme = createMuiTheme({
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
