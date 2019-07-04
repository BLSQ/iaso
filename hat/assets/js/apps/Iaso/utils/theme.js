import { createMuiTheme } from '@material-ui/core/styles';

const theme = createMuiTheme({
    typography: {
        useNextVariants: true,
    },
    palette: {
        primary: {
            main: '#215E8C',
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
