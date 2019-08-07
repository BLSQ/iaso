
const commonStyles = theme => ({
    whiteContainer: {
        margin: theme.spacing(2),
        backgroundColor: 'white',
        padding: theme.spacing(2),
        width: 'auto',
        border: '1px solid #ccc',
    },
    container: {
        paddingLeft: theme.spacing(2),
        paddingRight: theme.spacing(2),
    },
    whiteContainerNoMargin: {
        margin: 0,
        backgroundColor: 'white',
        paddingLeft: theme.spacing(2),
        paddingRight: theme.spacing(2),
        paddingTop: theme.spacing(4),
        paddingBottom: theme.spacing(4),
        width: 'auto',
        border: '1px solid #ccc',
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
    backButton: {
        marginRight: theme.spacing(2),
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
    justifyFlexEnd: {
        display: 'flex',
        justifyContent: 'flex-end',
    },
});

export default commonStyles;
