import Color from 'color';
import { styles as mapCluster } from './mapCluster';
import { styles as mapCustomControl } from './mapCustomControl';

export const getOverriddenTheme = (theme, themeConfig) => {
    const primaryColor = Color(themeConfig.THEME_PRIMARY_COLOR);
    const primaryBackgroundColor = Color(
        themeConfig.THEME_PRIMARY_BACKGROUND_COLOR,
    );
    const secondaryColor = Color(themeConfig.THEME_SECONDARY_COLOR);
    const primaryContrastText = primaryColor.isDark() ? '#fff' : '#000';
    const secondaryContrastText = secondaryColor.isDark() ? '#fff' : '#000';
    return {
        ...theme,
        palette: {
            ...theme.palette,
            primary: {
                contrastText: primaryContrastText,
                dark: primaryColor.darken(0.2).hex(),
                original: primaryColor,
                light: primaryColor.lighten(0.2).hex(),
                main: primaryColor.hex(),
                background: primaryBackgroundColor.hex(),
            },
            secondary: {
                contrastText: secondaryContrastText,
                dark: secondaryColor.darken(0.2).hex(),
                light: secondaryColor.lighten(0.2).hex(),
                main: secondaryColor.hex(),
            },
        },
        typography: {
            ...theme.typography,
            button: {
                ...theme.typography.button,
                fontFamily: '"Roboto", "Arial", sans-serif',
            },
        },
        overrides: {
            MuiCssBaseline: {
                '@global': {
                    ...mapCluster,
                    ...mapCustomControl,
                    body: {
                        height: '100vh',
                        overflow: 'hidden',
                        lineHeight: 1,
                        backgroundColor: 'white',
                    },
                    sup: {
                        verticalAlign: 'top',
                    },
                    a: {
                        color: theme.palette.info.dark,
                        textDecoration: 'none',
                        '&:hover': { textDecoration: 'underline' },
                    },
                    '& .leaflet-bar a': {
                        textDecoration: 'none !important',
                    },
                    '& .leaflet-tooltip': {
                        zIndex: 1000,
                    },
                    '& .leaflet-interactive': {
                        outline: 'none',
                    },
                    '& #notistack-snackbar': {
                        maxWidth: 400,
                    },
                },
            },
        },
    };
};
