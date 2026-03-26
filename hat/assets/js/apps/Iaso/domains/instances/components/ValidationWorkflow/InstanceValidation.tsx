import React, { FunctionComponent, useMemo } from 'react';
import { Box, Step, StepLabel, Stepper } from '@mui/material';

import { LoadingSpinner, useSafeIntl } from 'bluesquare-components';
import { userHasOneOfRoles } from 'Iaso/domains/users/utils';
import { useCurrentUser } from 'Iaso/utils/usersUtils';
import MESSAGES from '../../messages';
import {
    useGetNodesList,
    useGetSubmissionValidationStatus,
} from './useGetSubmissionValidationStatus';
import { ValidateNodeModal } from './ValidationModal';

const formatStepContent = stepContent => {
    if ('description' in stepContent) return stepContent.description;
    return `${stepContent.comment}
    ${stepContent.author}
    ${stepContent.date}
    `;
};

type Props = { id: number };
export const InstanceValidation: FunctionComponent<Props> = ({ id }) => {
    const { formatMessage } = useSafeIntl();

    const currentUser = useCurrentUser();
    const { data, isLoading } = useGetSubmissionValidationStatus(id);
    const { data: nodes, isFetching } = useGetNodesList(data?.workflow);
    console.log('DATA', data);
    console.log('NODES', nodes);
    const currentStep = data?.history?.[0];
    const currentStatus = currentStep?.status
        ? `${currentStep.level}: ${currentStep?.status}`
        : '';

    const canValidate = data?.userRoles
        ? userHasOneOfRoles(
              currentUser,
              data?.userRoles.map(r => r.value) ?? [],
          )
        : false;
    const validationTimeline = useMemo(() => {
        const templates = nodes?.nodeTemplates ?? [];
        const result = templates.map(node => {
            return {
                label: node.name,
                content: { description: node.description },
                status: 'inactive',
                color: node.color,
            };
        });

        data?.history.forEach(step => {
            const index = templates.findIndex(node => {
                return step.level === node.name;
            });

            if (index >= 0) {
                result[index] = {
                    ...result[index],
                    content: {
                        comment: step.comment,
                        author: step?.updatedBy ?? step.createdBy,
                        date: step.updatedAt,
                    },
                    status: step.status,
                };
            }
        });
        return result;
    }, [data, nodes]);
    console.log('TIMELINE', validationTimeline);

    return (
        <Box
            sx={{
                width: '100%',
                padding: theme => theme.spacing(2),
                margin: 0,
                overflow: 'auto',
            }}
        >
            {isLoading && <LoadingSpinner absolute fixed />}
            <Box>{currentStatus}</Box>
            {
                <>
                    {(data?.nextTasks ?? []).map(task => {
                        console.log('TASK', task);
                        return (
                            <ValidateNodeModal
                                key={task.id}
                                instanceId={id}
                                nodeId={task.id}
                            />
                        );
                    })}
                </>
            }
            {
                <>
                    {(data?.nextBypass ?? []).map(bypass => {
                        return (
                            <ValidateNodeModal
                                key={bypass.slug}
                                instanceId={id}
                                nodeSlug={bypass.slug}
                                iconProps={{
                                    sx: {
                                        marginRight: theme => theme.spacing(2),
                                    },
                                    buttonText: `${formatMessage(MESSAGES.validate)}: ${bypass.name ?? bypass.slug}`,
                                }}
                            />
                        );
                    })}
                </>
            }

            {(data?.history ?? []).length > 0 && (
                <Stepper
                    orientation="vertical"
                    activeStep={data?.history?.length - 1}
                    nonLinear
                    sx={{ margin: 'auto' }}
                    // activeStep={-1}
                >
                    {validationTimeline.map(step => {
                        return (
                            <Step key={step.label}>
                                <StepLabel
                                    StepIconProps={{
                                        sx: {
                                            color: step.color,
                                        },
                                    }}
                                >
                                    <Box>{step.label}</Box>
                                    <Box>{formatStepContent(step.content)}</Box>
                                </StepLabel>
                            </Step>
                        );
                    })}
                </Stepper>
            )}
        </Box>
    );
};
