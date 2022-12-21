import React, { useMemo } from 'react';
import { Grid, Typography, Box, Divider } from '@material-ui/core';
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
import {
    BUDGET_REQUEST,
    RRT_REVIEW,
    ORPG_REVIEW,
    REVIEW_FOR_APPROVAL,
    WORKFLOW_SUFFIX,
} from '../constants/budget.ts';
import { ExpandableItem } from '../../../../../hat/assets/js/apps/Iaso/domains/app/components/ExpandableItem.tsx';

const defaultToZero = value => (value === '' ? 0 : value);
const getRoundData = round => {
    const cost = parseInt(defaultToZero(round.cost ?? 0), 10);
    const population = parseInt(
        defaultToZero(round.target_population ?? 0),
        10,
    );
    const calculateRound = cost > 0 && population > 0;
    return {
        cost,
        population,
        calculateRound: cost > 0 && population > 0,
        costRoundPerChild: calculateRound ? (cost / population).toFixed(2) : 0,
    };
};

export const BudgetForm = () => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();

    const { values } = useFormikContext();
    const { rounds = [] } = values;

    const totalCostPerChild = useMemo(() => {
        let totalCost = 0;
        let totalPopulation = 0;
        rounds.forEach(r => {
            const roundData = getRoundData(r);
            totalCost += roundData.calculateRound ? roundData.cost : 0;
            totalPopulation += roundData.calculateRound
                ? roundData.population
                : 0;
        });
        return totalPopulation ? (totalCost / totalPopulation).toFixed(2) : '-';
    }, [rounds]);

    return (
        <>
            <Grid container spacing={2}>
                <Grid container direction="row" item spacing={2}>
                    <Grid xs={12} md={6} item>
                        <Box mb={2}>
                            <Typography variant="button">
                                {formatMessage(MESSAGES.budgetApproval)}
                            </Typography>
                        </Box>
                        <Box mb={2}>
                            <Divider style={{ height: '1px', width: '100%' }} />
                        </Box>
                    </Grid>
                    <Grid xs={12} md={3} item>
                        <Box mb={2}>
                            <Typography variant="button">
                                {formatMessage(MESSAGES.fundsRelease)}
                            </Typography>
                        </Box>
                        <Box mb={2}>
                            <Divider style={{ height: '1px', width: '100%' }} />
                        </Box>
                    </Grid>
                    <Grid xs={12} md={3} item>
                        <Box mb={2}>
                            <Typography variant="button">
                                {formatMessage(MESSAGES.costPerChild)}
                            </Typography>
                        </Box>
                        <Box mb={2}>
                            <Divider style={{ height: '1px', width: '100%' }} />
                        </Box>
                    </Grid>
                </Grid>

                <Grid item md={3}>
                    <Box mb={2}>
                        <Field
                            name="budget_status"
                            component={RABudgetStatusField}
                        />
                    </Box>
                    <Box mt={2}>
                        <Divider style={{ height: '1px', width: '100%' }} />
                    </Box>
                    <ExpandableItem
                        label={formatMessage(MESSAGES.budgetRequest)}
                    >
                        {BUDGET_REQUEST.map(node => {
                            return (
                                <Field
                                    key={node}
                                    label={formatMessage(MESSAGES[node])}
                                    name={`${node}${WORKFLOW_SUFFIX}`}
                                    component={DateInput}
                                    fullWidth
                                />
                            );
                        })}
                    </ExpandableItem>
                    <Divider style={{ height: '1px', width: '100%' }} />
                    <ExpandableItem label={formatMessage(MESSAGES.RRTReview)}>
                        {RRT_REVIEW.map(node => {
                            return (
                                <Field
                                    key={node}
                                    label={formatMessage(MESSAGES[node])}
                                    name={`${node}${WORKFLOW_SUFFIX}`}
                                    component={DateInput}
                                    fullWidth
                                />
                            );
                        })}
                    </ExpandableItem>
                    <Box mb={2}>
                        <Divider style={{ height: '1px', width: '100%' }} />
                    </Box>
                </Grid>
                <Grid item md={3}>
                    <Box mb={2}>
                        <Field
                            name="budget_responsible"
                            component={ResponsibleField}
                        />
                    </Box>
                    <Box mt={2}>
                        <Divider style={{ height: '1px', width: '100%' }} />
                    </Box>
                    <ExpandableItem label={formatMessage(MESSAGES.ORPGReview)}>
                        {ORPG_REVIEW.map(node => {
                            return (
                                <Field
                                    key={node}
                                    label={formatMessage(MESSAGES[node])}
                                    name={`${node}${WORKFLOW_SUFFIX}`}
                                    component={DateInput}
                                    fullWidth
                                />
                            );
                        })}
                    </ExpandableItem>
                    <Box>
                        <Divider style={{ height: '1px', width: '100%' }} />
                    </Box>
                    <ExpandableItem label={formatMessage(MESSAGES.approval)}>
                        {REVIEW_FOR_APPROVAL.map(node => {
                            return (
                                <Field
                                    key={node}
                                    label={formatMessage(MESSAGES[node])}
                                    name={`${node}${WORKFLOW_SUFFIX}`}
                                    component={DateInput}
                                    fullWidth
                                />
                            );
                        })}
                    </ExpandableItem>
                    <Box mb={2}>
                        <Divider style={{ height: '1px', width: '100%' }} />
                    </Box>
                </Grid>
                <Grid item md={3}>
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
                    <Field
                        label={formatMessage(MESSAGES.district_count)}
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
                </Grid>
                <Grid xs={12} md={3} item>
                    {rounds.map((round, i) => {
                        const roundData = getRoundData(round);
                        return (
                            <Box key={round.number}>
                                <Field
                                    label={`${formatMessage(MESSAGES.cost)} ${
                                        round.number
                                    }`}
                                    name={`rounds[${i}].cost`}
                                    component={TextInput}
                                    className={classes.input}
                                />
                                <Box mb={2}>
                                    <Typography>
                                        {formatMessage(
                                            MESSAGES.costPerChildRound,
                                        )}
                                        {` ${round.number}: $`}
                                        {roundData.calculateRound
                                            ? roundData.costRoundPerChild
                                            : ' -'}
                                    </Typography>
                                </Box>
                            </Box>
                        );
                    })}

                    <Typography>
                        {formatMessage(MESSAGES.costPerChildTotal)}: $
                        {totalCostPerChild}
                    </Typography>
                </Grid>
            </Grid>
        </>
    );
};
