/* eslint-disable camelcase */
import React, { FunctionComponent } from 'react';
import { makeStyles, Typography } from '@material-ui/core';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import moment from 'moment';
import MESSAGES from '../../constants/messages';
import { WARNING_COLOR } from '../../styles/constants';

type Props = {
    budgetDetails: any;
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
    return budgetEvents.sort(
        (
            a: { updated_at: moment.MomentInput },
            b: { updated_at: moment.MomentInput },
        ) => {
            return moment(a.updated_at).isSameOrAfter(moment(b.updated_at));
        },
    );
};

// TODO store statuses in constant
export const findBudgetStatus = budgetEvents => {
    if (!budgetEvents) return 'noBudgetSubmitted';
    return (
        sortBudgetEventByUpdate(budgetEvents).filter(
            event => event.type === 'submission',
        )[0]?.status ?? 'noBudgetSubmitted'
    );
};

export const BudgetStatus: FunctionComponent<Props> = ({ budgetDetails }) => {
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    const budgetStatus = findBudgetStatus(budgetDetails);
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
