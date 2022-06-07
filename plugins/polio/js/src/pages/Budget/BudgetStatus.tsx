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
});

// @ts-ignore
const useStyles = makeStyles(styles);

// TODO store statuses in constant
const findBudgetStatus = budgetEvents => {
    if (!budgetEvents) return 'validation_ongoing';
    return budgetEvents
        .sort((a, b) => {
            return moment(a).isSameOrAfter(moment(b));
        })
        .filter(event => event.type === 'submission')[0].status;
};

export const BudgetStatus: FunctionComponent<Props> = ({ budgetDetails }) => {
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    const budgetStatus = findBudgetStatus(budgetDetails?.results);
    return (
        <>
            <Typography variant="h6" className={classes.title} color="primary">
                {`${formatMessage(MESSAGES.status)}: `}
            </Typography>
            <Typography
                variant="h6"
                className={`${classes.title} ${classes[budgetStatus]}`}
                color="primary"
            >
                {formatMessage(MESSAGES[budgetStatus])}
            </Typography>
        </>
    );
};
