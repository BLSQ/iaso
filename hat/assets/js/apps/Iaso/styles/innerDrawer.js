const innerDrawer = theme => ({
    innerDrawerToolContainer: {
        height: '62vh',
        overflow: 'auto',
    },
    innerDrawerToolbar: {
        ...theme.mixins.toolbar,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        minHeight: '20px !important',
        padding: theme.spacing(1, 3),
    },
    innerDrawerContent: {
        width: '100%',
        padding: theme.spacing(1, 3, 0, 3),
    },
});

export default innerDrawer;
