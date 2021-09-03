import { styles as mapCluster } from './mapCluster';
import { styles as mapCustomControl } from './mapCustomControl';

export const getOverriddenTheme = theme => ({
    ...theme,
    overrides: {
        MuiCssBaseline: {
            '@global': {
                ...mapCluster,
                ...mapCustomControl,
                body: {
                    height: '100vh',
                    overflow: 'hidden',
                    lineHeight: 1,
                },
            },
        },
    },
});
