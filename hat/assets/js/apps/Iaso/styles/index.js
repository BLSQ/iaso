import { styles as mapCluster } from './mapCluster';
import { styles as mapCustomControl } from './mapCustomControl';

export const getOverridedTheme = theme => ({
    ...theme,
    overrides: {
        MuiCssBaseline: {
            '@global': {
                ...mapCluster,
                ...mapCustomControl,
            },
        },
    },
});
