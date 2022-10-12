/* eslint-disable camelcase */
import React, { FunctionComponent } from 'react';
import { makeStyles, Typography } from '@material-ui/core';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../constants/messages';
import { WARNING_COLOR } from '../../styles/constants';

type Props = {
    budgetStatus: string;
};

const styles = theme => ({
    title: {
        fontWeight: 'bold',
        [theme.breakpoints.down('md')]: {
            fontSize: 18,
        },
    },
    rejected: { color: theme.palette.error.main },
    validated: { color: theme.palette.success.main },
    validation_ongoing: { color: WARNING_COLOR },
    spacer: { marginRight: '5px' },
});

// @ts-ignore
const useStyles = makeStyles(styles);

export const BudgetStatus: FunctionComponent<Props> = ({ budgetStatus }) => {
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    return (
        <>
            <Typography
                variant="h5"
                className={`${classes.title} ${classes.spacer}`}
                color="primary"
            >
                {`${formatMessage(MESSAGES.status)}:`}
            </Typography>
            {budgetStatus && (
                <Typography
                    variant="h5"
                    className={`${classes.title}`}
                    color="primary"
                >
                    {budgetStatus}
                </Typography>
            )}
        </>
    );
};
