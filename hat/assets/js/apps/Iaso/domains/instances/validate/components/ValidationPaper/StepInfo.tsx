import React, { FunctionComponent, useCallback, useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import {
    textPlaceholder,
    useRedirectToReplace,
    useSafeIntl,
} from 'bluesquare-components';
import InputComponent from 'Iaso/components/forms/InputComponent';
import { baseUrls } from 'Iaso/constants/urls';
import { ValidationNodeRetrieveResponse } from 'Iaso/domains/validationWorkflowsConfiguration/types/validationNodes';
import { useParamsObject } from 'Iaso/routing/hooks/useParamsObject';
import MESSAGES from '../../messages';
import { InstanceValidationParams } from '../../types';
import { getActiveSteps } from '../../utils/getActiveSteps';

type Props = {
    formName: string;
    workflow: ValidationNodeRetrieveResponse | undefined;
    isLoading: boolean;
};

export const StepInfo: FunctionComponent<Props> = ({
    formName,
    workflow,
    isLoading,
}) => {
    const params = useParamsObject(
        baseUrls.instanceValidation,
    ) as InstanceValidationParams;
    const { formatMessage } = useSafeIntl();

    const { selectedStep } = params ?? {};
    const redirectToReplace = useRedirectToReplace();

    const { activeSteps, stepOptions } = useMemo(() => {
        const steps = getActiveSteps(workflow);
        return {
            activeSteps: steps,
            stepOptions: steps.map(step => ({
                label: step.name,
                value: `${step.id}`,
            })),
        };
    }, [workflow]);

    const selectedStepIndex = activeSteps.findIndex(
        step => `${step.id}` === selectedStep,
    );
    const bypassedSteps =
        selectedStepIndex === -1
            ? textPlaceholder
            : activeSteps
                  .slice(selectedStepIndex + 1)
                  .map(step => step.name)
                  .join(', ') || textPlaceholder;

    const onStepSelect = useCallback(
        (_: string, value: string) => {
            redirectToReplace(baseUrls.instanceValidation, {
                ...params,
                selectedStep: value,
            });
        },
        [redirectToReplace, params],
    );
    return (
        <Box m={2}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ fontWeight: 'bold' }}>
                    {formatMessage(MESSAGES.form)}
                </Typography>
                <Typography>{formName}</Typography>
            </Box>
            <Box mb={2}>
                <InputComponent
                    type="select"
                    clearable={false}
                    keyValue="selectedStep"
                    options={stepOptions}
                    value={selectedStep}
                    onChange={onStepSelect}
                    labelString={formatMessage(MESSAGES.step)}
                    loading={isLoading}
                />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ fontWeight: 'bold' }}>
                    {formatMessage(MESSAGES.bypassedSteps)}
                </Typography>
                <Typography>{bypassedSteps}</Typography>
            </Box>
        </Box>
    );
};
