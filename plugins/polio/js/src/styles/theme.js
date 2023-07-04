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
        marginBottom: theme.spacing(0),
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
    historyLink: {
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    historyIcon: {
        backgroundColor: 'red !important',
    },
    linkButton: {
        '& svg': {
            width: '1.25em',
            height: '1.25em',
        },
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
        position: 'relative',
        '& .MuiPaper-root.MuiDialog-paper.MuiDialog-paperScrollBody': {
            maxWidth: '80%',
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
        height: 'auto',
        maxHeight: 400,
        '& thead tr th': {
            boxShadow: `2px 2px ${theme.palette.ligthGray.main}`,
        },
        '& tbody tr:hover': {
            backgroundColor: theme.palette.action.hover,
        },
    },
    districtListRow: {
        '& td': {
            backgroundColor: theme.palette.gray.background,
        },
    },
    tablePagination: {
        '& .MuiTablePagination-toolbar': {
            overflowX: 'auto',
        },
    },
    tableHeadCell: {
        borderRight: `2px solid ${theme.palette.ligthGray.border}`,
        position: 'relative',
        overflow: 'hidden',
        textAlign: 'center',
        backgroundColor: 'white',
    },
    sortableTableHeadCell: {
        borderRight: `2px solid ${theme.palette.ligthGray.border}`,
        position: 'relative',
        overflow: 'hidden',
        textAlign: 'center',
        backgroundColor: 'white',
        cursor: 'pointer',
    },
    lqasImTableCell: {
        padding: theme.spacing(1, 2),
    },
    subTabs: {
        padding: theme.spacing(0, 2),
    },
    subTab: {
        fontSize: 12,
        minWidth: 100,
        width: 100,
    },
    addRoundButton: {
        fontSize: 10,
        height: 20,
        marginTop: 14,
    },
    tabsContainer: {
        position: 'relative',
    },
    iconButton: {
        color: 'white !important',
        height: 30,
        position: 'relative',
        top: 8,
    },
    removeIconButton: {
        position: 'relative',
        top: 19,
        right: 15,
        height: 20,
        '& svg': {
            width: 14,
            height: 14,
        },
    },
    removeContainer: {
        padding: 0,
        margin: 0,
        position: 'absolute',
        left: theme.spacing(4),
        top: -5,
        minHeight: 0,
        height: 1,
        width: `calc(100% - ${theme.spacing(4)}px)`,
        display: 'flex',
        listStyleType: 'none',
        zIndex: 100000,
    },
    removeContainerItem: {
        display: 'inline-flex',
        justifyContent: 'flex-end',
        width: 100,
        fontSize: 5,
    },
    tabPanel: {
        padding: 0,
        width: '100%',
    },
    fullHeight: { height: '100%' },
    vaccinesSelect: {
        fontSize: 12,
        positio: 'relative',
        height: theme.spacing(5),
        paddingTop: theme.spacing(1),
        paddingBottom: theme.spacing(1),
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
    vaccineName: {
        fontWeight: 'bold',
    },
    roundColor: {
        marginRight: theme.spacing(1),
        width: 18,
        height: 18,
        borderRadius: '100%',
        border: `1px solid ${theme.palette.primary.main}`,
        display: 'inline-block',
        position: 'relative',
    },
    roundColorInner: {
        position: 'absolute',
        top: 3,
        left: 3,
        width: 10,
        height: 10,
        borderRadius: '100%',
        backgroundColor: theme.palette.primary.main,
        opacity: 0.7,
    },
    vaccinesList: {
        paddingBottom: 0,
        paddingTop: 0,
        width: 175,
        position: 'relative',
        left: -16,
    },
    tab: {
        '& .MuiTab-wrapper': {
            display: 'flex',
            flexDirection: 'row-reverse',
        },
    },
    tabError: {
        color: `${theme.palette.error.main} !important`,
    },
    tabDisabled: {
        color: `${theme.palette.text.disabled} !important`,
        cursor: 'default',
    },
    tabIcon: {
        position: 'relative',
        top: 1,
        left: theme.spacing(0.5),
        color: theme.palette.primary.main,
        cursor: 'pointer',
    },
}));
