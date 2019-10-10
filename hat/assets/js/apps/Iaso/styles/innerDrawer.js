
export const menuHeight = 112;
export const tabsHeight = 68;

const innerDrawer = theme => ({
    innerDrawerToolContainer: {
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
        overflow: 'auto',
        marginTop: theme.spacing(2),
        height: `calc(100vh - ${menuHeight + tabsHeight}px)`, // ugly way to fix innerdrawer content height
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
