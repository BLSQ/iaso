import { makeStyles } from '@mui/styles';

export const useStyles = makeStyles(theme => ({
    root: {
        width: '100%',
        '&.MuiStepper-root': {
            padding: 0,
            marginTop: theme.spacing(2),
        },
        '& .MuiBox-root': {
            alignItems: 'flex-start',
        },
    },
    step: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    stepDivider: {
        width: `1px !important`,
        height: `30px !important`,
        margin: `auto !important`,
        borderColor: '#666 !important',
    },
    checkboxWrapper: {
        display: 'flex',
        alignItems: 'center',
    },
    taskIcon: {
        transform: 'scale(0.85)',
        position: 'relative',
        top: -3,
    },
    taskDone: {
        color: theme.palette.success.main,
    },
    taskPending: {
        // @ts-ignore
        color: theme.palette.mediumGray.main,
    },
    itemLabel: {
        fontSize: '0.82rem',
    },
    divider: {
        height: '30px',
        // @ts-ignore
        backgroundColor: theme.palette.gray.main,
    },
    stepCompleted: {
        '& + div .MuiStepConnector-lineHorizontal': {
            borderColor: theme.palette.success.main,
        },
    },
    stepActive: {
        '& + div .MuiStepConnector-lineHorizontal': {
            // @ts-ignore
            borderColor: theme.palette.yellow.main,
        },
    },
    stepInactive: {
        '& + div .MuiStepConnector-lineHorizontal': {
            // @ts-ignore
            borderColor: theme.palette.gray.main,
        },
    },
    strikethrough: {
        textDecoration: 'line-through',
    },
    overrideIcon: {
        // @ts-ignore
        color: theme.palette.gray.main,
    },
    latestItem: { fontWeight: 'bold' },
}));
