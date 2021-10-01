import React from 'react';
import { Grid, Typography, Box } from '@material-ui/core';
import { Field, useFormikContext } from 'formik';
import { useSafeIntl } from 'bluesquare-components';
import { useStyles } from '../styles/theme';
import MESSAGES from '../constants/messages';
import {
    DateInput,
    ResponsibleField,
    RABudgetStatusField,
    TextInput,
    PaymentField,
} from '../components/Inputs';

const defaultToZero = value => (value === '' ? 0 : value);

export const BudgetForm = () => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();

    const { values } = useFormikContext();

    const round1Cost = parseInt(
        defaultToZero(values?.round_one?.cost ?? 0),
        10,
    );
    const round2Cost = parseInt(
        defaultToZero(values?.round_two?.cost ?? 0),
        10,
    );

    const round1Population = parseInt(
        defaultToZero(values?.round_one?.target_population ?? 0),
        10,
    );
    const round2Population = parseInt(
        defaultToZero(values?.round_two?.target_population ?? 0),
        10,
    );

    const calculateRound1 = round1Cost > 0 && round1Population > 0;
    const calculateRound2 = round2Cost > 0 && round2Population > 0;

    const totalCost =
        (calculateRound1 ? round1Cost : 0) + (calculateRound2 ? round2Cost : 0);

    const totalPopulation =
        (calculateRound1 ? round1Population : 0) +
        (calculateRound2 ? round2Population : 0);

    const costRound1PerChild = calculateRound1
        ? (round1Cost / round1Population).toFixed(2)
        : 0;

    const costRound2PerChild = calculateRound2
        ? (round2Cost / round2Population).toFixed(2)
        : 0;

    const totalCostPerChild = (totalCost / totalPopulation).toFixed(2);

    return (
        <>
            <Grid container spacing={2}>
                <Grid container direction="row" item spacing={2}>
                    <Grid xs={12} md={6} item>
                        <Field
                            name="budget_status"
                            component={RABudgetStatusField}
                        />
                    </Grid>
                    <Grid xs={12} md={6} item>
                        <Field
                            name="budget_responsible"
                            component={ResponsibleField}
                        />
                    </Grid>
                </Grid>

                <Grid xs={12} md={6} item>
                    <Box mb={2}>
                        <Field
                            name="payment_mode"
                            component={PaymentField}
                            fullWidth
                        />
                    </Box>
                    <Field
                        label={formatMessage(MESSAGES.disbursedToCoWho)}
                        name="who_disbursed_to_co_at"
                        component={DateInput}
                        fullWidth
                    />
                    <Field
                        label={formatMessage(MESSAGES.disbursedToMohWho)}
                        name="who_disbursed_to_moh_at"
                        component={DateInput}
                        fullWidth
                    />
                    <Field
                        label={formatMessage(MESSAGES.disbursedToCoUnicef)}
                        name="unicef_disbursed_to_co_at"
                        component={DateInput}
                        fullWidth
                    />
                    <Field
                        label={formatMessage(MESSAGES.disbursedToMohUnicef)}
                        name="unicef_disbursed_to_moh_at"
                        component={DateInput}
                        fullWidth
                    />
                </Grid>

                <Grid item md={6}>
                    <Field
                        label={formatMessage(MESSAGES.rrtOprttApproval)}
                        name="budget_rrt_oprtt_approval_at"
                        component={DateInput}
                        fullWidth
                    />

                    <Field
                        label={formatMessage(MESSAGES.eomgGroup)}
                        name="eomg"
                        component={DateInput}
                        fullWidth
                    />

                    <Field
                        label={formatMessage(MESSAGES.budgetSubmittedAt)}
                        name="budget_submitted_at"
                        component={DateInput}
                        fullWidth
                    />

                    <Field
                        label={formatMessage(MESSAGES.districtCount)}
                        name="district_count"
                        component={TextInput}
                        className={classes.input}
                    />

                    <Field
                        label={formatMessage(MESSAGES.noRegretFund)}
                        name="no_regret_fund_amount"
                        component={TextInput}
                        className={classes.input}
                    />

                    <Field
                        label={formatMessage(MESSAGES.costRoundOne)}
                        name="round_one.cost"
                        component={TextInput}
                        className={classes.input}
                    />

                    <Field
                        label={formatMessage(MESSAGES.costRoundTwo)}
                        name="round_two.cost"
                        component={TextInput}
                        className={classes.input}
                    />

                    <Typography>
                        {formatMessage(MESSAGES.costPerChildRoundOne)}
                        {calculateRound1 ? costRound1PerChild : ' -'}
                    </Typography>
                    <Typography>
                        {formatMessage(MESSAGES.costPerChildRoundTwo)}
                        {calculateRound2 ? costRound2PerChild : ' -'}
                    </Typography>
                    <Typography>
                        {formatMessage(MESSAGES.costPerChildTotal)}
                        {calculateRound1 || calculateRound2
                            ? totalCostPerChild
                            : ' -'}
                    </Typography>
                </Grid>
            </Grid>
        </>
    );
};
