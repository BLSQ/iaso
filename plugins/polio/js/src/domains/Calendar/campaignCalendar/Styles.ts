import { red } from '@mui/material/colors';
import { makeStyles } from '@mui/styles';

export const cellHeight = 50;
const smallCellHeight = 20;
export const vaccineOpacity = 0.7;
export const useStyles = makeStyles(theme => {
    return {
        tableContainer: {
            overflow: 'auto',
            width: '100%',
            [theme.breakpoints.up('lg')]: {
                height: '67vh',
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
                // @ts-ignore
                borderRight: `1px solid ${theme.palette.ligthGray.border}`,
            },
        },
        tableRowSmall: {
            height: smallCellHeight,
        },
        tableCell: {
            height: cellHeight,
            padding: '0 !important',
            margin: '0 !important',
            position: 'relative',
            // @ts-ignore
            borderLeft: `1px solid ${theme.palette.ligthGray.border}`,
        },
        tableCellHead: {
            height: cellHeight,
            padding: '0 !important',
            margin: '0 !important',
            position: 'sticky',
            // @ts-ignore
            borderLeft: `1px solid ${theme.palette.ligthGray.border}`,
        },
        tableCellTopBordered: {
            height: cellHeight,
            padding: '0 !important',
            margin: '0 !important',
            position: 'sticky',
            // @ts-ignore
            borderTop: `1px solid ${theme.palette.ligthGray.border}`,
        },
        tableCellTitle: {
            padding: '0 !important',
            margin: '0 !important',
            position: 'sticky',
            height: cellHeight,
            // @ts-ignore
            borderLeft: `1px solid ${theme.palette.ligthGray.border}`,
            // @ts-ignore
            borderTop: `1px solid ${theme.palette.ligthGray.border}`,
        },
        tableCellTitleSmall: {
            width: '30px',
        },
        tableCellTitleEmpty: {
            border: 'none !important',
            backgroundColor: theme.palette.common.white,
        },
        tableCellBordered: {
            // @ts-ignore
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
            // @ts-ignore
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
            width: '300px',
            left: theme.spacing(1),
            top: 17,
            zIndex: 3,
            position: 'absolute',
            display: 'block',
            justifyContent: 'center',
        },
        navButton: {
            margin: `${theme.spacing(1)} !important`,
            borderRadius: '100% !important',
            padding: `${theme.spacing(1)} !important`,
            minWidth: '0 !important',
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
        },
        tableCellSpanTitle: {
            alignItems: 'center',
            justifyContent: 'flex-start',
            paddingLeft: theme.spacing(1),
            paddingRight: theme.spacing(1),
            fontWeight: 'bold',
            fontSize: 10,
            lineHeight: '14px',
        },
        tableCellSpanWithPopOver: {
            cursor: 'pointer',
        },
        tableCellSpanRow: {
            alignItems: 'center',
            justifyContent: 'flex-start',
            fontSize: 9,
            wordBreak: 'break-word',
        },
        popper: {
            zIndex: 500,
            width: 400,
            backgroundColor: 'white',
        },
        popperClose: {
            position: 'absolute',
            top: theme.spacing(1),
            right: theme.spacing(1),
        },
        mapLegend: {
            position: 'absolute',
            zIndex: 499,
            fontSize: 10,
            top: theme.spacing(2),
            right: theme.spacing(2),
        },
        mapLegendVaccine: {
            width: 150,
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
            // @ts-ignore
            border: `2px solid ${theme.palette.ligthGray.border}`,
        },
        mapLegendLabel: {
            textAlign: 'right',
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
    };
});
