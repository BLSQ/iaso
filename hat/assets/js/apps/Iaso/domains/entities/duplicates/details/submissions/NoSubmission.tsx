import React, { FunctionComponent } from 'react';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import { useSafeIntl } from 'bluesquare-components';
import { makeStyles } from '@material-ui/core';
import MESSAGES from '../../messages';

const useStyles = makeStyles(theme => ({
    root: {
        padding: theme.spacing(3, 2),
    },
    paragraph: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
}));

export const NoSubmission: FunctionComponent = () => {
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    return (
        <Paper className={classes.root}>
            <Typography component="p" className={classes.paragraph}>
                {formatMessage(MESSAGES.noSubmissionFound)}
            </Typography>
        </Paper>
    );
};
