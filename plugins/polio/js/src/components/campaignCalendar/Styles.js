import { makeStyles } from '@material-ui/core';
import red from '@material-ui/core/colors/red';

const cellHeight = 50;
const smallCellHeight = 20;
export const useStyles = makeStyles(theme => ({
    tableContainer: {
        overflow: 'hidden',
        width: '100%',
        marginLeft: theme.spacing(2),
        marginRight: theme.spacing(2),
    },
    tableRow: {
        height: cellHeight,
    },
    tableRowSmall: {
        height: smallCellHeight,
    },
    tableCell: {
        height: cellHeight,
        padding: 0,
        margin: 0,
        position: 'relative',
        border: `1px solid ${theme.palette.ligthGray.border}`,
    },
    tableCellTitle: {
        width: '20px',
        padding: 0,
        margin: 0,
        position: 'relative',
        height: cellHeight,
        border: `1px solid ${theme.palette.ligthGray.border}`,
    },
    tableCellBordered: {
        border: `1px solid ${theme.palette.ligthGray.border}`,
    },
    tableCellSmall: {
        height: smallCellHeight,
    },
    tableRowHidden: {
        visibility: 'collapse',
    },
    tableCellHidden: {
        border: `1px solid white`,
        borderBottom: `1px solid ${theme.palette.ligthGray.border}`,
    },
    round: {
        backgroundColor: theme.palette.secondary.main,
        color: theme.palette.common.white,
        fontSize: 12,
    },
    round2: {
        backgroundColor: theme.palette.secondary.light,
    },
    campaign: {
        backgroundColor: theme.palette.grey[200],
        border: 'none',
        fontSize: 12,
    },
    currentWeek: {
        backgroundColor: red['100'],
    },
    navButton: {
        marginTop: theme.spacing(1),
    },
    tableCellSpan: {
        position: 'absolute',
        display: 'flex',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        textTransform: 'uppercase',
    },
    tableCellSpanTitle: {
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingLeft: theme.spacing(2),
        fontWeight: 'bold',
    },
    tableCellSpanRow: {
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingLeft: theme.spacing(2),
    },
}));
