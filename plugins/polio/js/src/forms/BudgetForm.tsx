/* eslint-disable camelcase */
import React, { FunctionComponent, useCallback, useMemo } from 'react';
import { Grid, Typography, Box, Divider } from '@material-ui/core';
import { Field, FormikErrors, FormikTouched, useFormikContext } from 'formik';
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
} from '../constants/budget';
import { ExpandableItem } from '../../../../../hat/assets/js/apps/Iaso/domains/app/components/ExpandableItem';
import { hasFormikFieldError } from '../../../../../hat/assets/js/apps/Iaso/utils/forms';
import { Round } from '../constants/types';

const defaultToZero = (value?: string | number | null): number => {
    const toParse = value ? '0' : `${value}`;
    return parseInt(toParse, 10);
};

type DataForBudget = {
    cost: number;
    population: number;
    calculateRound: boolean;
    costRoundPerChild: string;
};
const getRoundData = (round: Round): DataForBudget => {
    const cost = defaultToZero(round.cost);
    const population = defaultToZero(round.target_population);
    const calculateRound = cost > 0 && population > 0;
    return {
        cost,
        population,
        calculateRound: cost > 0 && population > 0,
        costRoundPerChild: calculateRound
            ? (cost / population).toFixed(2)
            : '0',
    };
};

const findErrorInFieldList = (
    keys: string[],
    errors: FormikErrors<any>,
    touched: FormikTouched<any>,
): boolean => {
    return Boolean(
        keys.find(key =>
            hasFormikFieldError(`${key}${WORKFLOW_SUFFIX}`, errors, touched),
        ),
    );
};

const findBudgetStateIndex = (values: Record<string, any>): number => {
    for (let i = BUDGET_STATES.length - 1; i >= 0; i -= 1) {
        const key = `${BUDGET_STATES[i]}${WORKFLOW_SUFFIX}`;
        if (values[key]) {
            return i;
        }
    }
    return -1;
};

const findNewBudgetState = (
    fieldIndex: number,
    values: Record<string, any>,
): string | null => {
    for (let i = fieldIndex - 1; i >= 0; i -= 1) {
        const key = `${BUDGET_STATES[i]}${WORKFLOW_SUFFIX}`;
        if (values[key]) {
            return BUDGET_STATES[i];
        }
    }
    return null;
};

export const budgetFormFields = (rounds: Round[]): string[] => {
    return [
        'budget_status_at_WFEDITABLE',
        'rounds_at_WFEDITABLE',
        'ra_completed_at_WFEDITABLE',
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

export const BudgetForm: FunctionComponent = () => {
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const { values, touched, errors, setFieldValue } = useFormikContext<any>();

    const { rounds = [], has_data_in_budget_tool: disableEdition } = values;

    const totalCostPerChild: string = useMemo(() => {
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

    const hasRequestFieldsError: boolean = findErrorInFieldList(
        BUDGET_REQUEST,
        errors,
        touched,
    );
    const hasRRTReviewError: boolean = findErrorInFieldList(
        RRT_REVIEW,
        errors,
        touched,
    );
    const hasORPGReviewError: boolean = findErrorInFieldList(
        ORPG_REVIEW,
        errors,
        touched,
    );
    const hasApprovalFieldsError: boolean = findErrorInFieldList(
        REVIEW_FOR_APPROVAL,
        errors,
        touched,
    );

    const updateBudgetStatus = useCallback(
        (fieldName: string, value: any) => {
            const fieldKey = fieldName.replace(WORKFLOW_SUFFIX, '');
            const computedBudgetStatusIndex = findBudgetStateIndex(values);
            const fieldIndex = BUDGET_STATES.findIndex(
                budgetState => budgetState === fieldKey,
            );
            if (fieldIndex > computedBudgetStatusIndex && value) {
                setFieldValue('budget_status', fieldKey);
                setFieldValue('budget_current_state_key', fieldKey);
            } else if (!value && fieldIndex >= computedBudgetStatusIndex) {
                const newBudgetState = findNewBudgetState(fieldIndex, values);
                setFieldValue('budget_status', newBudgetState);
                setFieldValue(
                    'budget_current_state_key',
                    newBudgetState ?? '-',
                );
            }
        },
        [setFieldValue, values],
    );

    const title: string = disableEdition
        ? `${formatMessage(MESSAGES.budgetApproval)}: ${formatMessage(
              MESSAGES.editionDisabled,
          )}`
        : formatMessage(MESSAGES.budgetApproval);

    const budgetStatusMessage: string = MESSAGES[
        values.budget_current_state_key
    ]
        ? formatMessage(MESSAGES[values.budget_current_state_key])
        : values.budget_status ?? values.budget_current_state_key;

    return (
        <Grid container spacing={2} direction="row">
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
                <Grid container direction="row" item spacing={2}>
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
