import React, { FunctionComponent } from 'react';

import { makeStyles } from '@material-ui/core';
import Paper from '@material-ui/core/Paper';
import Typography from '@material-ui/core/Typography';
import Warning from '@material-ui/icons/Warning';

import { commonStyles } from 'bluesquare-components';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    root: {
        // @ts-ignore
        backgroundColor: theme.palette.error.background,
        padding: theme.spacing(3, 2),
    },
    paragraph: {
        display: 'flex',
        alignItems: 'center',
        color: theme.palette.error.main,
        justifyContent: 'center',
    },
    buttonIcon: {
        ...commonStyles(theme).buttonIcon,
        width: 35,
        height: 35,
    },
}));

type Props = {
    message?: string;
};

const ErrorPaperComponent: FunctionComponent<Props> = ({ message = '' }) => {
    const classes: Record<string, string> = useStyles();
    return (
        <Paper className={classes.root}>
            <Typography component="p" className={classes.paragraph}>
                <Warning className={classes.buttonIcon} />
                {message}
            </Typography>
        </Paper>
    );
};

export default ErrorPaperComponent;
