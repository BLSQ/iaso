/* eslint-disable camelcase */
import React, { FunctionComponent } from 'react';
import { makeStyles, Typography } from '@material-ui/core';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../constants/messages';

type Props = {
    nextSteps: string[];
};

const useStyles = makeStyles(theme => ({
    title: {
        fontWeight: 'bold',
        [theme.breakpoints.down('md')]: { fontSize: 18 },
    },
    spacer: { marginRight: '5px' },
}));

export const NextBudgetStep: FunctionComponent<Props> = ({ nextSteps }) => {
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    return (
        <>
            <Typography
                variant="h5"
                className={`${classes.title} ${classes.spacer}`}
                color="primary"
            >
                {`${formatMessage(MESSAGES.nextSteps)}:`}
            </Typography>
            {nextSteps?.map((nextStep: string) => (
                <Typography
                    variant="h5"
                    className={`${classes.title}`}
                    color="primary"
                    key={nextStep}
                >
                    {nextStep}
                </Typography>
            ))}
        </>
    );
};
