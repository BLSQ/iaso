import { makeStyles } from '@mui/styles';
import { red } from '@mui/material/colors';

const cellHeight = 50;
const smallCellHeight = 20;
export const vaccineOpacity = 0.6;
export const useStyles = makeStyles(theme => ({
    tableContainer: {
        overflow: 'auto',
        width: '100%',
        [theme.breakpoints.up('lg')]: {
            height: '71vh',
        },
    },
    tableContainerPdf: {
        overflow: 'hidden',
        width: '100%',
        [theme.breakpoints.up('lg')]: {
            height: 'auto',
        },
    },
    tableRow: {
        height: cellHeight,
        '& th:last-child, & td:last-child': {
            borderRight: `1px solid ${theme.palette.ligthGray.border}`,
        },
    },
    tableRowSmall: {
        height: smallCellHeight,
    },
    tableCell: {
        height: cellHeight,
        padding: 0,
        margin: 0,
        position: 'relative',
        borderLeft: `1px solid ${theme.palette.ligthGray.border}`,
    },
    tableCellHead: {
        height: cellHeight,
        padding: 0,
        margin: 0,
        position: 'sticky',
        borderLeft: `1px solid ${theme.palette.ligthGray.border}`,
    },
    tableCellTopBordered: {
        height: cellHeight,
        padding: 0,
        margin: 0,
        position: 'sticky',
        borderTop: `1px solid ${theme.palette.ligthGray.border}`,
    },
    tableCellTitle: {
        padding: 0,
        margin: 0,
        position: 'sticky',
        height: cellHeight,
        borderLeft: `1px solid ${theme.palette.ligthGray.border}`,
        borderTop: `1px solid ${theme.palette.ligthGray.border}`,
    },
    tableCellTitleSmall: {
        width: '30px',
    },
    tableCellTitleEmpty: {
        border: 'none',
        backgroundColor: theme.palette.common.white,
    },
    tableCellBordered: {
        borderLeft: `1px solid ${theme.palette.ligthGray.border}`,
    },
    tableCellDashed: {
        border: `1px dashed ${theme.palette.secondary.main} !important`,
    },
    tableCellSmall: {
        height: smallCellHeight,
    },
    tableRowHidden: {
        visibility: 'collapse',
        height: 0,
    },
    tableCellHidden: {
        height: 0,
        border: `1px solid #fafafa`,
        borderBottom: `1px solid ${theme.palette.ligthGray.border}`,
    },
    round: {
        fontSize: 12,
    },
    campaign: {
        backgroundColor: theme.palette.grey[200],
        border: 'none',
        fontSize: 12,
    },
    currentWeek: {
        backgroundColor: red['100'],
    },
    nav: {
        left: theme.spacing(2),
        top: 0,
        zIndex: 3,
        position: 'absolute',
        display: 'flex',
        width: '31vw',
        justifyContent: 'center',
        [theme.breakpoints.up('lg')]: {
            width: '21vw',
        },
    },
    navButton: {
        margin: theme.spacing(1.5),
        borderRadius: 100,
        padding: theme.spacing(1),
        minWidth: 0,
    },
    weeksCell: {
        fontSize: 9,
    },
    tableCellSpan: {
        position: 'absolute',
        display: 'flex',
        top: '0px',
        left: '0px',
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
        paddingRight: theme.spacing(2),
        fontWeight: 'bold',
        fontSize: 11,
        lineHeight: '14px',
    },
    tableCellSpanWithPopOver: {
        cursor: 'pointer',
    },
    tableCellSpanRow: {
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingLeft: theme.spacing(1),
        paddingRight: theme.spacing(1),
        fontSize: 11,
    },
    popper: {
        zIndex: 500,
        width: 250,
    },
    popperClose: {
        position: 'relative',
        marginLeft: '85%',
        marginTop: theme.spacing(-1),
        marginBottom: theme.spacing(1),
    },
    mapLegend: {
        position: 'absolute',
        zIndex: 499,
        fontSize: 10,
        top: theme.spacing(2),
        right: theme.spacing(2),
    },
    mapLegendVaccine: {
        width: 100,
        marginTop: theme.spacing(2),
    },
    mapLegendCampaigns: {
        width: 165,
    },
    mapLegendTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: theme.spacing(1),
    },
    mapLegendCampaignTitle: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    roundColor: {
        borderRadius: theme.spacing(3),
        height: theme.spacing(3),
        width: theme.spacing(3),
        opacity: vaccineOpacity,
        border: `2px solid ${theme.palette.ligthGray.border}`,
    },
    mapLegendLabel: {
        textAlign: 'right',
    },
    noCampaign: {
        textAlign: 'center',
    },
    mapLegendText: {
        fontWeight: 'bold',
    },
    coloredBox: {
        position: 'absolute',
        zIndex: 0,
        height: '100%',
        width: '100%',
        top: 0,
        left: 0,
    },
}));
