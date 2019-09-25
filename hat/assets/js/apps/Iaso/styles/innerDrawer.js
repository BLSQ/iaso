const innerDrawer = theme => ({
    innerDrawerToolbar: {
        ...theme.mixins.toolbar,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        height: 50,
    },
    innerDrawerContent: {
        width: '100%',
        padding: theme.spacing(1, 0, 0, 0),
    },
});

export default innerDrawer;
