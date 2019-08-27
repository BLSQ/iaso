
const commonStyles = theme => ({
    paperContainer: {
        padding: theme.spacing(4),
        margin: theme.spacing(4),
    },
    indicator: {
        backgroundColor: 'white',
    },
    buttonIcon: {
        marginRight: theme.spacing(1),
        width: 15,
        height: 15,
    },
    listitem: {
        width: 'auto',
        paddingLeft: theme.spacing(1),
    },
    marginBottom: {
        marginBottom: theme.spacing(2),
    },
    marginLeft: {
        marginLeft: theme.spacing(2),
    },
    marginTop: {
        marginTop: theme.spacing(2),
    },
    marginTopBig: {
        marginTop: theme.spacing(4),
    },
    justifyFlexEnd: {
        display: 'flex',
        justifyContent: 'flex-end',
    },
    floatRight: {
        float: 'right',
    },
    tabs: {
        padding: theme.spacing(0, 4),
    },
    mapContainer: {
        height: '70vh',
        marginBottom: theme.spacing(2),
    },
});

export default commonStyles;
