import { createMuiTheme } from '@material-ui/core/styles';

const theme = createMuiTheme({
    typography: {
        useNextVariants: true,
    },
    textColor: '#333',
    palette: {
        primary: {
            // main: '#97C53F',
            main: '#2372BA',
            contrastText: '#FFFFFF',
        },
        gray: {
            main: '#666',
        },
        error: {
            main: 'rgb(215, 25, 28)',
            background: 'rgba(215, 25, 28, 0.2)',
        },
        success: {
            main: '#4caf50',
            background: 'rgba(#4caf50, 0.2)',
        },
    },
});

export default theme;
