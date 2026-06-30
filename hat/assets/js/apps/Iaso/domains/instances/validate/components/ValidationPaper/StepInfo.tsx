import React, { FunctionComponent, useCallback, useMemo } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import {
    DropdownOptions,
    textPlaceholder,
    UrlParams,
    useRedirectToReplace,
    useSafeIntl,
} from 'bluesquare-components';
import InputComponent from 'Iaso/components/forms/InputComponent';
import { baseUrls } from 'Iaso/constants/urls';
import {
    Timeline,
    ValidationNodeRetrieveResponse,
} from 'Iaso/domains/validationWorkflowsConfiguration/types/validationNodes';
import { useParamsObject } from 'Iaso/routing/hooks/useParamsObject';
import MESSAGES from '../../messages';

type Props = {
    formName: string;
    workflow: ValidationNodeRetrieveResponse | undefined;
    isLoading: boolean;
};

type Params = {
    accountId: string;
    instanceId: string;
    selectedStep?: string;
} & Partial<UrlParams>;

export const StepInfo: FunctionComponent<Props> = ({
    formName,
    workflow,
    isLoading,
}) => {
    const params: Params = useParamsObject(
        baseUrls.instanceValidation,
    ) as Params;
    const { formatMessage } = useSafeIntl();

    const { selectedStep } = params ?? {};
    const redirectToReplace = useRedirectToReplace();

    const activeSteps: Timeline[] = useMemo(() => {
        return (
            workflow?.submissions?.[0].timeline
                .filter((el: Timeline) => el.user_can_do_actions)
                .filter(
                    (el: Timeline) =>
                        el.status !== 'ACCEPTED' && el.status !== 'SKIPPED',
                ) ?? []
        );
    }, [workflow]);

    const stepOptions: DropdownOptions<string>[] = useMemo(() => {
        return activeSteps.map(step => ({
            label: step.name,
            value: `${step.id}`,
        }));
    }, [activeSteps]);

    const stepToDisplay =
        stepOptions.find(option => option.value === selectedStep)?.label ??
        textPlaceholder;

    const bypassed_steps =
        activeSteps
            .filter((_: any, i: number) => {
                const index = activeSteps.findIndex(
                    step => step.name === stepToDisplay,
                );
                return i > index;
            })
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
        <Paper
            elevation={1}
            sx={{
                padding: theme => theme.spacing(2),
                margin: 0,
                overflow: 'auto',
                marginLeft: theme => theme.spacing(2),
                marginRight: theme => theme.spacing(2),
            }}
        >
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
                <Typography>{bypassed_steps}</Typography>
            </Box>
        </Paper>
    );
};
