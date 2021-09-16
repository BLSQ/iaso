import { makeStyles } from '@material-ui/core';
import red from '@material-ui/core/colors/red';
import { colsCount } from './constants';

const cellHeight = 50;
const smallCellHeight = 20;
export const useStyles = makeStyles(theme => ({
    tableContainer: {
        overflow: 'hidden',
        width: cellHeight * colsCount,
        borderTop: `1px solid ${theme.palette.ligthGray.border}`,
        borderRight: `1px solid ${theme.palette.ligthGray.border}`,
        marginLeft: theme.spacing(2),
        marginRight: theme.spacing(2),
    },
    tableRow: {
        height: cellHeight,
        borderLeft: `1px solid ${theme.palette.ligthGray.border}`,
    },
    tableRowSmall: {
        height: smallCellHeight,
    },
    tableCell: {
        height: cellHeight,
        padding: 0,
        margin: 0,
        border: 'none',
    },
    tableCellBordered: {
        border: `1px solid ${theme.palette.ligthGray.border}`,
    },
    tableCellFixed: {
        width: cellHeight,
    },
    tableCellSmall: {
        height: smallCellHeight,
    },
    round: {
        backgroundColor: theme.palette.secondary.main,
        color: theme.palette.common.white,
    },
    campaign: {
        backgroundColor: theme.palette.grey[200],
        border: 'none',
        fontSize: 10,
    },
    currentWeek: {
        backgroundColor: red['100'],
    },
    navButton: {
        marginTop: theme.spacing(1),
    },
}));
