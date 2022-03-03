import Color from 'color';
import { styles as mapCluster } from './mapCluster';
import { styles as mapCustomControl } from './mapCustomControl';

export const getOverriddenTheme = theme => {
    const primaryColor = Color(process.env.REACT_THEME_PRIMARY_COLOR);
    const primaryBackgroundColor = Color(
        process.env.REACT_THEME_PRIMARY_BACKGROUND_COLOR,
    );
    const primaryContrastText = primaryColor.isDark() ? '#fff' : '#000';
    const secondaryColor = Color(process.env.REACT_THEME_SECONDARY_COLOR);
    const secondaryContrastText = secondaryColor.isDark() ? '#fff' : '#000';
    return {
        ...theme,
        palette: {
            ...theme.palette,
            primary: {
                contrastText: primaryContrastText,
                dark: primaryColor.darken(0.2).hex(),
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
                },
            },
        },
    };
};
