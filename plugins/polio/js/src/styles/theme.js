import { makeStyles } from '@material-ui/core';
import { commonStyles, theme } from 'bluesquare-components';

export const useStyles = makeStyles(() => ({
    ...commonStyles(theme),
    root: {
        flexGrow: 1,
    },
    table: {
        borderSpacing: 0,
        width: '100%',
        border: '1px solid rgba(0,0,0,0.1)',
    },
    tableHeader: {
        display: 'flex',
        boxShadow: '0 2px 15px 0 rgb(0 0 0 / 15%)',
    },
    tableRow: {
        display: 'flex',
    },
    pageActions: {
        marginBottom: theme.spacing(2),
    },
    pageAction: {
        marginRight: theme.spacing(1),
    },
    form: {
        marginTop: theme.spacing(4),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
    },
    round1FormCalculations: {
        marginTop: theme.spacing(4),
        marginBottom: theme.spacing(4),
    },
    input: {
        marginBottom: theme.spacing(2),
    },
    tabs: {
        borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
    },
    mainModal: {
        '& .MuiPaper-root.MuiDialog-paper.MuiDialog-paperScrollBody': {
            maxWidth: '1380px',
        },
        // below rule to remove useless scrollbar
        '& .MuiTablePagination-root': {
            overflowX: 'clip',
        },
        // below rule to remove useless scrollbar
        '& .MuiDialogContent-root': {
            overflowY: 'visible',
        },
    },
    districtList: {
        overflow: 'auto',
        height: '500px',
        '& thead tr th': {
            boxShadow: `2px 2px ${theme.palette.ligthGray.main}`,
        },
        '& .MuiSvgIcon-root': {
            color: theme.palette.gray.main,
        },
        '& tbody tr:hover': {
            backgroundColor: theme.palette.action.hover,
        },
    },
    districtListRow: {
        '& td': {
            backgroundColor: theme.palette.ligthGray.main,
        },
    },
    tablePagination: {
        '& .MuiTablePagination-toolbar': {
            overflowX: 'auto',
        },
    },
}));
