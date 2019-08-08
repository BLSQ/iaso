import { createMuiTheme } from '@material-ui/core/styles';

const theme = createMuiTheme({
    typography: {
        useNextVariants: true,
    },
    textColor: '#333',
    palette: {
        primary: {
            main: '#2372BA',
        },
        gray: {
            main: '#666',
        },
        error: {
            main: 'rgb(215, 25, 28)',
            background: 'rgba(215, 25, 28, 0.2)',
        },
    },
});

export default theme;
