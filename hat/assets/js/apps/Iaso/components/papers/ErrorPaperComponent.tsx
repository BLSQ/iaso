import React, { FunctionComponent } from 'react';

import { makeStyles } from '@mui/styles';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Warning from '@mui/icons-material/Warning';

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
