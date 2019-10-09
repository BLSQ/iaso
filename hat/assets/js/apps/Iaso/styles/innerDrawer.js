
export const menuHeight = 112;

const innerDrawer = theme => ({
    innerDrawerToolContainer: {
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        flex: 'auto',
    },
    innerDrawerToolbar: {
        ...theme.mixins.toolbar,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        minHeight: '20px !important',
        padding: theme.spacing(1, 3),
    },
    innerDrawerContentContainer: {
        width: '100%',
        flex: 'auto',
        marginTop: theme.spacing(2),
    },
    innerDrawerContent: {
        width: '100%',
        padding: theme.spacing(1, 3),
        flex: 'auto',
    },
    innerDrawerTabs: {
        minWidth: 100,
    },
    innerDrawerTab: {
        minWidth: 100,
    },
});

export default innerDrawer;
