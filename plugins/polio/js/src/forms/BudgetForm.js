/* eslint-disable camelcase */
import React, { useCallback, useMemo } from 'react';
import { Grid, Typography, Box, Divider } from '@material-ui/core';
import { Field, useFormikContext } from 'formik';
import { useSafeIntl } from 'bluesquare-components';
import { useStyles } from '../styles/theme';
import MESSAGES from '../constants/messages';
import { DateInput, TextInput, PaymentField } from '../components/Inputs';
import {
    BUDGET_STATES,
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

const findBudgetStateIndex = values => {
    for (let i = BUDGET_STATES.length - 1; i >= 0; i -= 1) {
        const key = `${BUDGET_STATES[i]}${WORKFLOW_SUFFIX}`;
        if (values[key]) {
            return i;
        }
    }
    return -1;
};

export const budgetFormFields = rounds => {
    return [
        'budget_status_at_WFEDITABLE',
        // 'budget_responsible_at_WFEDITABLE',
        'rounds_at_WFEDITABLE',
        'who_sent_budget_at_WFEDITABLE',
        'unicef_sent_budget_at_WFEDITABLE',
        'gpei_consolidated_budgets_at_WFEDITABLE',
        'submitted_to_rrt_at_WFEDITABLE',
        'feedback_sent_to_gpei_at_WFEDITABLE',
        're_submitted_to_rrt_at_WFEDITABLE',
        'submitted_to_orpg_operations1_at_WFEDITABLE',
        'feedback_sent_to_rrt1_at_WFEDITABLE',
        'submitted_to_orpg_wider_at_WFEDITABLE',
        'feedback_sent_to_rrt2_at_WFEDITABLE',
        'submitted_to_orpg_operations2_at_WFEDITABLE',
        're_submitted_to_orpg_operations1_at_WFEDITABLE',
        're_submitted_to_orpg_operations2_at_WFEDITABLE',
        'submitted_for_approval_at_WFEDITABLE',
        'feedback_sent_to_orpg_operations_unicef_at_WFEDITABLE',
        'feedback_sent_to_orpg_operations_who_at_WFEDITABLE',
        'approved_by_who_at_WFEDITABLE',
        'approved_by_unicef_at_WFEDITABLE',
        'approved_at_WFEDITABLE',
        'approval_confirmed_at_WFEDITABLE',
        'payment_mode',
        'who_disbursed_to_co_at',
        'who_disbursed_to_moh_at',
        'unicef_disbursed_to_co_at',
        'unicef_disbursed_to_moh_at',
        'district_count',
        'no_regret_fund_amount',
        ...rounds.map((_round, i) => {
            return `rounds[${i}].cost`;
        }),
    ];
};

export const BudgetForm = () => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    const { values, touched, errors, setFieldValue } = useFormikContext();

    const { rounds = [], has_data_in_budget_tool: disableEdition } = values;

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

    const updateBudgetStatus = useCallback(
        (fieldName, value) => {
            const fieldKey = fieldName.replace(WORKFLOW_SUFFIX, '');
            const computedBudgetStatusIndex = findBudgetStateIndex(values);
            const fieldIndex = BUDGET_STATES.findIndex(
                budgetState => budgetState === fieldKey,
            );
            console.log('click', fieldIndex, computedBudgetStatusIndex);
            if (fieldIndex > computedBudgetStatusIndex && value) {
                console.log('setting value', fieldKey);
                setFieldValue('budget_status', fieldKey);
                setFieldValue('budget_current_state_key', fieldKey);
            } else if (!value && fieldIndex >= computedBudgetStatusIndex) {
                // Need to fall back on next available status
                console.log('removing value');
                setFieldValue('budget_status', null);
                setFieldValue('budget_current_state_key', '-');
            }

            // if (computedBudgetStatus !== values.budget_status) {
            //     console.log('updating', computedBudgetStatus, values.budget_status);
            //     setFieldValue('budget_status', computedBudgetStatus);
            //     setFieldValue('budget_current_state_key', computedBudgetStatus);
            // }
        },
        [setFieldValue, values],
    );

    const title = disableEdition
        ? `${formatMessage(MESSAGES.budgetApproval)}: ${formatMessage(
              MESSAGES.editionDisabled,
          )}`
        : formatMessage(MESSAGES.budgetApproval);

    const budgetStatusMessage = MESSAGES[values.budget_current_state_key]
        ? formatMessage(MESSAGES[values.budget_current_state_key])
        : values.budget_status ?? values.budget_current_state_key;
    return (
        <Grid container spacing={2} direction="row">
            {/* Budget: xs={12} md={6} */}
            <Grid
                container
                item
                xs={12}
                md={4}
                lg={6}
                spacing={2}
                direction="column"
            >
                <Grid item>
                    <Box mb={2} ml={2} textAlign="center">
                        <Typography variant="button">{title}</Typography>
                    </Box>
                    <Box>
                        <Divider />
                    </Box>
                </Grid>
                <Grid item>
                    <Box mb={2} px={2} py={2}>
                        <Typography variant="button">
                            {`${formatMessage(
                                MESSAGES.status,
                            )}: ${budgetStatusMessage}`}
                        </Typography>
                    </Box>
                    <Box>
                        <Divider />
                    </Box>
                </Grid>
                <Grid container direction="row" item>
                    <Grid item xs={12} lg={6}>
                        <ExpandableItem
                            label={formatMessage(MESSAGES.budgetRequest)}
                            preventCollapse={hasRequestFieldsError}
                        >
                            {BUDGET_REQUEST.map((node, index) => {
                                return (
                                    <Box mt={index === 0 ? 2 : 0} key={node}>
                                        <Field
                                            label={formatMessage(
                                                MESSAGES[node],
                                            )}
                                            name={`${node}${WORKFLOW_SUFFIX}`}
                                            component={DateInput}
                                            fullWidth
                                            disabled={disableEdition}
                                            onChange={updateBudgetStatus}
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
                                            label={formatMessage(
                                                MESSAGES[node],
                                            )}
                                            name={`${node}${WORKFLOW_SUFFIX}`}
                                            component={DateInput}
                                            fullWidth
                                            disabled={disableEdition}
                                            onChange={updateBudgetStatus}
                                        />
                                    </Box>
                                );
                            })}
                        </ExpandableItem>
                        <Box mb={2}>
                            <Divider />
                        </Box>
                    </Grid>

                    <Grid item xs={12} lg={6}>
                        <ExpandableItem
                            label={formatMessage(MESSAGES.ORPGReview)}
                            preventCollapse={hasORPGReviewError}
                        >
                            {ORPG_REVIEW.map((node, index) => {
                                return (
                                    <Box mt={index === 0 ? 2 : 0} key={node}>
                                        <Field
                                            label={formatMessage(
                                                MESSAGES[node],
                                            )}
                                            name={`${node}${WORKFLOW_SUFFIX}`}
                                            component={DateInput}
                                            fullWidth
                                            disabled={disableEdition}
                                            onChange={updateBudgetStatus}
                                        />
                                    </Box>
                                );
                            })}
                        </ExpandableItem>
                        <Box>
                            <Divider />
                        </Box>
                        <ExpandableItem
                            label={formatMessage(MESSAGES.approval)}
                            preventCollapse={hasApprovalFieldsError}
                        >
                            {REVIEW_FOR_APPROVAL.map((node, index) => {
                                return (
                                    <Box mt={index === 0 ? 2 : 0} key={node}>
                                        <Field
                                            label={formatMessage(
                                                MESSAGES[node],
                                            )}
                                            name={`${node}${WORKFLOW_SUFFIX}`}
                                            component={DateInput}
                                            fullWidth
                                            disabled={disableEdition}
                                            onChange={updateBudgetStatus}
                                        />
                                    </Box>
                                );
                            })}
                        </ExpandableItem>
                        <Box mb={2}>
                            <Divider style={{ height: '1px', width: '100%' }} />
                        </Box>
                    </Grid>
                </Grid>
            </Grid>
            {/* Funds release xs={12} md={3} */}
            <Grid container item xs={12} md={4} lg={3}>
                <Grid item xs={12}>
                    <Box mb={2} textAlign="center">
                        <Typography variant="button">
                            {formatMessage(MESSAGES.fundsRelease)}
                        </Typography>
                    </Box>
                    <Box mb={2}>
                        <Divider style={{ height: '1px', width: '100%' }} />
                    </Box>
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
            </Grid>
            {/* cost per child xs={12} md={3} */}
            <Grid container item xs={12} md={4} lg={3}>
                <Grid item xs={12}>
                    <Box mb={2} textAlign="center">
                        <Typography variant="button">
                            {formatMessage(MESSAGES.costPerChild)}
                        </Typography>
                    </Box>
                    <Box mb={2}>
                        <Divider style={{ height: '1px', width: '100%' }} />
                    </Box>
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
        </Grid>
    );
};
