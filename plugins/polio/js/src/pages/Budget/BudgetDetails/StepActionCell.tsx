import React, { FunctionComponent, useMemo } from 'react';
import { useMediaQuery, useTheme, Box } from '@material-ui/core';
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
    const repeatTransition = repeatTransitions.find(transition => {
        return (
            transition.key.replace('repeat_', '') === budgetStep.transition_key
        );
    });
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
