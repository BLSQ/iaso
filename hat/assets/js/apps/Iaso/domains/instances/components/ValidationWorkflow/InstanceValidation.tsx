import React, { FunctionComponent } from 'react';
import {
    Box,
    Step,
    StepContent,
    StepLabel,
    Stepper,
    Typography,
} from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import moment from 'moment';
import { apiMobileDateFormat } from 'Iaso/utils/dates';
import MESSAGES from '../../messages';
import { useGetNodesList } from './useGetSubmissionValidationStatus';
import { useValidationTimeline } from './useValidationTimeline';
import { ValidateNodeModal } from './ValidationModal';

const formatStepContent = stepContent => {
    if ('description' in stepContent)
        return (
            <Typography variant="body2">{stepContent.description}</Typography>
        );
    return (
        <>
            {stepContent.comment && (
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {stepContent.comment}
                </Typography>
            )}
            {stepContent.author && (
                <Typography variant="subtitle2" sx={{ fontWeight: 'normal' }}>
                    {stepContent.author}
                </Typography>
            )}
            {stepContent.date && (
                <Typography variant="subtitle2" sx={{ fontWeight: 'normal' }}>
                    {moment(stepContent.date, apiMobileDateFormat).format(
                        'DD-MM-YYYY HH:mm:ss',
                    )}
                </Typography>
            )}
        </>
    );
};

type Props = { id?: number; data?: any };
export const InstanceValidation: FunctionComponent<Props> = ({ id, data }) => {
    const { formatMessage } = useSafeIntl();

    const { data: nodes } = useGetNodesList(data?.workflow);

    const validationTimeline = useValidationTimeline({ data, nodes });

    return (
        <Box
            sx={{
                width: '100%',
                padding: theme => theme.spacing(2),
                margin: 0,
                overflow: 'auto',
            }}
        >
            {(data?.history ?? []).length > 0 && (
                <Stepper
                    orientation="vertical"
                    activeStep={data?.history?.length - 1}
                    nonLinear
                    sx={{ margin: 'auto' }}
                >
                    {validationTimeline.map(step => {
                        return (
                            <Step key={step.label} expanded>
                                <StepLabel
                                    error={step.status === 'REJECTED'}
                                    StepIconProps={{
                                        sx: {
                                            color: step.color,
                                        },
                                    }}
                                >
                                    <Box>{step.label}</Box>
                                    <StepContent sx={{ fontWeight: 'normal' }}>
                                        {formatStepContent(step.content)}
                                        {step.canValidate && (
                                            <ValidateNodeModal
                                                key={step.slug}
                                                instanceId={id}
                                                nodeSlug={step.slug}
                                                nodeId={step.nodeId}
                                                iconProps={{
                                                    buttonText: `${formatMessage(MESSAGES.validate)}`,
                                                }}
                                            />
                                        )}
                                    </StepContent>
                                </StepLabel>
                            </Step>
                        );
                    })}
                </Stepper>
            )}
        </Box>
    );
};
