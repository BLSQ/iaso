/* eslint-disable camelcase */
import React, { FunctionComponent } from 'react';
import { makeStyles, Typography } from '@material-ui/core';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import moment from 'moment';
import MESSAGES from '../../constants/messages';
import { WARNING_COLOR } from '../../styles/constants';

type Props = {
    budgetStatus: 'validation_ongoing' | 'validated' | 'noBudgetSubmitted';
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

export const sortBudgetEventByUpdate = budgetEvents => {
    if (!budgetEvents) return [];
    const sorted = budgetEvents.sort(
        (
            a: { created_at: moment.MomentInput },
            b: { created_at: moment.MomentInput },
        ) => {
            return moment(a.created_at).isSameOrBefore(moment(b.created_at));
        },
    );
    return sorted;
};

export const findBudgetStatus = budgetEvents => {
    const orderedEvents = sortBudgetEventByUpdate([...(budgetEvents ?? [])]);
    return orderedEvents[0]?.status ?? 'noBudgetSubmitted';
};

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
            <Typography
                variant="h5"
                className={`${classes.title} ${classes[budgetStatus]}`}
                color="primary"
            >
                {`${formatMessage(MESSAGES[budgetStatus])}`}
            </Typography>
        </>
    );
};
