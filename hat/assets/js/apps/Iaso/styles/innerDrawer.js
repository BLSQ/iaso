const innerDrawer = theme => ({
    innerDrawerToolbar: {
        ...theme.mixins.toolbar,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        height: 50,
        paddingLeft: theme.spacing(3),
        paddingRight: theme.spacing(3),
    },
    innerDrawerContent: {
        width: '100%',
        padding: theme.spacing(1, 3, 0, 3),
    },
});

export default innerDrawer;
