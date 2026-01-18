import { makeStyles } from '@mui/styles';

export const useStyles = makeStyles(theme => ({
    root: {
        width: 400,
        overflow: 'hidden',
    },
    toolbar: {
        ...theme.mixins.toolbar,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingLeft: theme.spacing(2),
        paddingRight: theme.spacing(2),
        height: theme.spacing(8),
    },
    search: {
        marginLeft: theme.spacing(1),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        width: '100%',
    },
    list: {
        maxHeight: `calc(100vh - ${theme.spacing(8)})`,
        overflowY: 'auto',
        overflowX: 'hidden',
    },
    listWithApply: {
        maxHeight: `calc(100vh - ${theme.spacing(16)})`,
        overflowY: 'auto',
        overflowX: 'hidden',
    },
    listItem: {
        height: theme.spacing(6),
    },
    switch: {
        marginRight: theme.spacing(1),
    },
    placeholder: {
        height: 15,
        // @ts-ignore
        backgroundColor: theme.palette.ligthGray.main,
        borderRadius: 5,
        marginRight: theme.spacing(1),
        width: '50%',
    },
    input: {
        width: '100%',
        padding: 0,
    },
}));
