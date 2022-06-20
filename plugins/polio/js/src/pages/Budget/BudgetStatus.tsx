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
    title: { fontWeight: 'bold' },
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
            a: { updated_at: moment.MomentInput },
            b: { updated_at: moment.MomentInput },
        ) => {
            return moment(a.updated_at).isSameOrBefore(moment(b.updated_at));
        },
    );
    console.log('sorted', sorted);
    return sorted;
};

export const findBudgetStatus = budgetEvents => {
    if (!budgetEvents) return 'noBudgetSubmitted';
    if (budgetEvents.length > 0) {
        const orderedEvents = budgetEvents.sort((a, b) => {
            return moment(a.updated_at).isBefore(moment(b.updated_at));
        });
        return orderedEvents[0].status ?? 'noBudgetSubmitted';
    }
    return 'noBudgetSubmitted';
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
