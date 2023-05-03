import React, { FunctionComponent, useMemo } from 'react';
import { useMediaQuery, useTheme, Box } from '@material-ui/core';
import moment from 'moment';

import { Transition, BudgetStep, Params } from '../types';
import { DeleteRestoreButton } from './DeleteRestoreButton';
import { CreateBudgetStepIcon } from '../CreateBudgetStep/CreateBudgetStep';
import { getStyle, useStyles } from '../hooks/config';
import { Paginated } from '../../../../../../../hat/assets/js/apps/Iaso/types/table';

type Props = {
    budgetStep: BudgetStep;
    params: Params;
    budgetDetails?: Paginated<BudgetStep>;
    repeatTransitions: Transition[];
};

export const StepActionCell: FunctionComponent<Props> = ({
    budgetStep,
    params,
    budgetDetails,
    repeatTransitions,
}) => {
    const classes = useStyles();
    const getRowColor = getStyle(classes);
    const theme = useTheme();

    const repeatTransition = useMemo(() => {
        if (budgetDetails?.results) {
            // Already repeated step
            if (budgetStep.transition_key.includes('repeat_')) {
                const tempTransition = repeatTransitions.find(
                    transition => transition.key === budgetStep.transition_key,
                );
                // if is present in list of steps to repeat
                if (tempTransition && budgetDetails.results) {
                    // step can be repeated multiple times, we need to repeat only the last one
                    const repeatedSteps = budgetDetails.results
                        .filter(
                            step =>
                                step.transition_key ===
                                budgetStep.transition_key,
                        )
                        .sort((a, b) =>
                            moment(a.created_at).isBefore(b.created_at)
                                ? 1
                                : -1,
                        );
                    // Repeated multiple times
                    if (repeatedSteps.length > 1) {
                        const lastRepeat = repeatedSteps[0];
                        // if this is the last one
                        if (lastRepeat.id === budgetStep.id) {
                            return tempTransition;
                        }
                        // Repeated only once
                    } else {
                        return tempTransition;
                    }
                }
            }
            // Original step
            if (
                // if this step has not been repeated
                !budgetDetails.results.find(
                    tr =>
                        tr.transition_key ===
                        `repeat_${budgetStep.transition_key}`,
                )
            ) {
                // if is present in list of steps to repeat
                return repeatTransitions.find(
                    transition =>
                        transition.key.replace('repeat_', '') ===
                        budgetStep.transition_key,
                );
            }
            return undefined;
        }
        return undefined;
    }, [
        budgetDetails?.results,
        budgetStep.id,
        budgetStep.transition_key,
        repeatTransitions,
    ]);

    const isMobileLayout = useMediaQuery(theme.breakpoints.down('md'));

    const { previousStep, quickTransition, campaignId } = params;
    const previousBudgetStep = useMemo(() => {
        if (!quickTransition) return null;
        return (budgetDetails?.results ?? []).find(
            step => step.id === parseInt(previousStep, 10),
        );
    }, [budgetDetails?.results, previousStep, quickTransition]);
    const isQuickTransition = repeatTransition?.key === quickTransition;
    return (
        <>
            {repeatTransition && (
                <Box display="inline-block" mr={1}>
                    <CreateBudgetStepIcon
                        isMobileLayout={isMobileLayout}
                        campaignId={campaignId}
                        iconProps={{
                            label: repeatTransition.label,
                            color: repeatTransition.color,
                            disabled: !repeatTransition.allowed,
                        }}
                        transitionKey={repeatTransition.key}
                        transitionLabel={repeatTransition.label}
                        defaultOpen={isQuickTransition}
                        previousStep={
                            isQuickTransition
                                ? (previousBudgetStep as BudgetStep)
                                : undefined
                        }
                        requiredFields={repeatTransition.required_fields}
                        params={params}
                        recipients={
                            repeatTransition.emails_destination_team_ids
                        }
                    />
                </Box>
            )}
            <DeleteRestoreButton
                stepId={budgetStep.id}
                className={getRowColor(Boolean(budgetStep.deleted_at))}
                isStepDeleted={Boolean(budgetStep.deleted_at)}
            />
        </>
    );
};
