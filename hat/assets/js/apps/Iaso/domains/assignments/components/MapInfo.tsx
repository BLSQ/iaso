import React, { FunctionComponent } from 'react';
import {
    // @ts-ignore
    useSafeIntl,
} from 'bluesquare-components';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { Tooltip, Paper } from '@mui/material';
import { makeStyles } from '@mui/styles';

import MESSAGES from '../messages';

export const useStyles = makeStyles(theme => ({
    root: {
        position: 'absolute',
        zIndex: 499,
        bottom: theme.spacing(5),
        left: theme.spacing(2),
        borderRadius: '100%',
        height: theme.spacing(4),
        width: theme.spacing(4),
    },
    icon: {
        fontSize: theme.spacing(4),
    },
}));

export const MapInfo: FunctionComponent = () => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    return (
        <Paper elevation={1} className={classes.root}>
            <Tooltip title={formatMessage(MESSAGES.mapHelper)} arrow>
                <HelpOutlineIcon color="primary" className={classes.icon} />
            </Tooltip>
        </Paper>
    );
};
