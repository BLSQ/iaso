import React, { useMemo } from 'react';
import { Grid, Typography, Box, Divider } from '@material-ui/core';
import { Field, useFormikContext } from 'formik';
import { useSafeIntl } from 'bluesquare-components';
import { findKey } from 'lodash';

import { useStyles } from '../styles/theme';
import MESSAGES from '../constants/messages';
import {
    DateInput,
    ResponsibleField,
    BudgetStatusField,
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
import { hasFormikFieldError } from '../../../../../hat/assets/js/apps/Iaso/utils/forms';

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

const findErrorInFieldList = (keys, errors, touched) => {
    return Boolean(
        keys.find(key =>
            hasFormikFieldError(`${key}${WORKFLOW_SUFFIX}`, errors, touched),
        ),
    );
};

export const budgetFormFields = rounds => {
    return [
        'budget_status_at_WFEDITABLE',
        'budget_responsible_at_WFEDITABLE',
        'rounds_at_WFEDITABLE',
        'budget_requested_at_WFEDITABLE',
        'who_sent_budget_at_WFEDITABLE',
        'unicef_sent_budget_at_WFEDITABLE',
        'gpei_consolidation_at_WFEDITABLE',
        'submitted_to_rrt_at_WFEDITABLE',
        'feedback_sent_to_gpei_at_WFEDITABLE',
        're_submitted_to_rrt_at_WFEDITABLE',
        'submission_to_orpg_operations_1_at_WFEDITABLE',
        'feedback_sent_to_rrt1_at_WFEDITABLE',
        'submitted_to_orpg_at_WFEDITABLE',
        'feedback_sent_to_rrt2_at_WFEDITABLE',
        're_submitted_to_orpg_at_WFEDITABLE',
        'submission_to_orpg_operations_2_at_WFEDITABLE',
        'feedback_sent_to_rrt3_at_WFEDITABLE',
        're_submission_to_orpg_operations_2_at_WFEDITABLE',
        'submitted_for_approval_at_WFEDITABLE',
        'feedback_sent_to_orpg_operations_unicef_at_WFEDITABLE',
        'feedback_sent_to_orpg_operations_who_at_WFEDITABLE',
        'approved_by_who_at_WFEDITABLE',
        'approved_by_unicef_at_WFEDITABLE',
        'approved_at_WFEDITABLE',
        'payment_mode',
        'who_disbursed_to_co_at',
        'who_disbursed_to_moh_at',
        'unicef_disbursed_to_co_at',
        'unicef_disbursed_to_moh_at',
        'district_count',
        'no_regret_fund_amount',
        ...rounds.map((round, i) => {
            console.log(findKey(rounds[i], rounds[i].cost));
            return findKey(rounds[i], rounds[i].cost);
        }),
    ];
};

export const BudgetForm = () => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    const { touched, errors } = useFormikContext();

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
    const hasRequestFieldsError = findErrorInFieldList(
        BUDGET_REQUEST,
        errors,
        touched,
    );
    const hasRRTReviewError = findErrorInFieldList(RRT_REVIEW, errors, touched);
    const hasORPGReviewError = findErrorInFieldList(
        ORPG_REVIEW,
        errors,
        touched,
    );
    const hasApprovalFieldsError = findErrorInFieldList(
        REVIEW_FOR_APPROVAL,
        errors,
        touched,
    );

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
                            component={BudgetStatusField}
                        />
                    </Box>
                    <Box mt={2}>
                        <Divider style={{ height: '1px', width: '100%' }} />
                    </Box>
                    <ExpandableItem
                        label={formatMessage(MESSAGES.budgetRequest)}
                        preventCollapse={hasRequestFieldsError}
                    >
                        {BUDGET_REQUEST.map((node, index) => {
                            return (
                                <Box mt={index === 0 ? 2 : 0} key={node}>
                                    <Field
                                        label={formatMessage(MESSAGES[node])}
                                        name={`${node}${WORKFLOW_SUFFIX}`}
                                        component={DateInput}
                                        fullWidth
                                    />
                                </Box>
                            );
                        })}
                    </ExpandableItem>
                    <Divider style={{ height: '1px', width: '100%' }} />
                    <ExpandableItem
                        label={formatMessage(MESSAGES.RRTReview)}
                        preventCollapse={hasRRTReviewError}
                    >
                        {RRT_REVIEW.map((node, index) => {
                            return (
                                <Box mt={index === 0 ? 2 : 0} key={node}>
                                    <Field
                                        label={formatMessage(MESSAGES[node])}
                                        name={`${node}${WORKFLOW_SUFFIX}`}
                                        component={DateInput}
                                        fullWidth
                                    />
                                </Box>
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
                    <ExpandableItem
                        label={formatMessage(MESSAGES.ORPGReview)}
                        preventCollapse={hasORPGReviewError}
                    >
                        {ORPG_REVIEW.map((node, index) => {
                            return (
                                <Box mt={index === 0 ? 2 : 0} key={node}>
                                    <Field
                                        label={formatMessage(MESSAGES[node])}
                                        name={`${node}${WORKFLOW_SUFFIX}`}
                                        component={DateInput}
                                        fullWidth
                                    />
                                </Box>
                            );
                        })}
                    </ExpandableItem>
                    <Box>
                        <Divider style={{ height: '1px', width: '100%' }} />
                    </Box>
                    <ExpandableItem
                        label={formatMessage(MESSAGES.approval)}
                        preventCollapse={hasApprovalFieldsError}
                    >
                        {REVIEW_FOR_APPROVAL.map((node, index) => {
                            return (
                                <Box mt={index === 0 ? 2 : 0} key={node}>
                                    <Field
                                        label={formatMessage(MESSAGES[node])}
                                        name={`${node}${WORKFLOW_SUFFIX}`}
                                        component={DateInput}
                                        fullWidth
                                    />
                                </Box>
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
