import { Box, Divider, Grid, Typography } from '@mui/material';
import { Field, FormikErrors, FormikTouched, useFormikContext } from 'formik';
import React, { FunctionComponent, useCallback } from 'react';

import { ExpandableItem, useSafeIntl } from 'bluesquare-components';

import { hasFormikFieldError } from '../../../../../../../hat/assets/js/apps/Iaso/utils/forms';
import { DateInput } from '../../../components/Inputs';
import {
    BUDGET_REQUEST,
    BUDGET_STATES,
    ORPG_REVIEW,
    REVIEW_FOR_APPROVAL,
    RRT_REVIEW,
    WORKFLOW_SUFFIX,
} from '../../../constants/budget';
import MESSAGES from '../messages';
import { BudgetDetail } from '../types';

type Props = {
    disableEdition?: boolean;
    currentState?: string;
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
export const BudgetProcessApproval: FunctionComponent<Props> = ({
    disableEdition,
    currentState,
}) => {
    const { formatMessage } = useSafeIntl();

    const { values, errors, touched, setFieldValue } =
        useFormikContext<BudgetDetail>();
    const updateBudgetStatus = useCallback(
        (fieldName: string, value: any) => {
            const fieldKey = fieldName.replace(WORKFLOW_SUFFIX, '');
            const computedBudgetStatusIndex = findBudgetStateIndex(values);
            const fieldIndex = BUDGET_STATES.findIndex(
                budgetState => budgetState === fieldKey,
            );
            if (fieldIndex > computedBudgetStatusIndex && value) {
                setFieldValue('current_state_key', fieldKey);
            } else if (!value && fieldIndex >= computedBudgetStatusIndex) {
                const newBudgetState = findNewBudgetState(fieldIndex, values);
                setFieldValue('current_state_key', newBudgetState ?? '-');
            }
        },
        [setFieldValue, values],
    );
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
    return (
        <>
            {currentState && (
                <Grid item xs={12}>
                    <Box mb={2}>
                        <Typography variant="button">
                            {`${formatMessage(
                                MESSAGES.status,
                            )}: ${currentState}`}
                        </Typography>
                    </Box>
                    <Box>
                        <Divider />
                    </Box>
                </Grid>
            )}
            <Grid item xs={12} lg={6}>
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
                                    label={formatMessage(MESSAGES[node])}
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
                                    label={formatMessage(MESSAGES[node])}
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
                                    label={formatMessage(MESSAGES[node])}
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
        </>
    );
};
