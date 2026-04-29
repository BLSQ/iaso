import React, { FunctionComponent } from 'react';
import SendIcon from '@mui/icons-material/Send';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import {
    Avatar,
    Box,
    Step,
    StepContent,
    StepLabel,
    Stepper,
    Typography,
} from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import moment from 'moment';
import { ValidationNodeRetrieveResponse } from 'Iaso/domains/instances/validationWorkflow/types/validationNodes';
import { SxStyles } from 'Iaso/types/general';
import { apiMobileDateFormat } from 'Iaso/utils/dates';
import MESSAGES from '../../messages';
import { useGetNodesList } from './useGetSubmissionValidationStatus';
import {
    useValidationTimeline,
    UseValidationTimelineResult,
} from './useValidationTimeline';
import { ValidateNodeModal } from './ValidationModal';

const formatStepContent = (step: UseValidationTimelineResult) => {
    if (step?.status === 'SUBMISSION' || step?.status === 'NEW_VERSION') {
        return (
            <>
                {step.content.author && (
                    <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 'normal' }}
                    >
                        {step.content.author}
                    </Typography>
                )}
                {step.content.date && (
                    <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 'normal' }}
                    >
                        {moment(step.content.date, apiMobileDateFormat).format(
                            'DD-MM-YYYY HH:mm:ss',
                        )}
                    </Typography>
                )}
            </>
        );
    }

    if (step?.status === 'ACCEPTED' || step?.status === 'REJECTED') {
        return (
            <>
                {step?.content?.comment && (
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {step.content.comment}
                    </Typography>
                )}
                {step?.content?.author && (
                    <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 'normal' }}
                    >
                        {step?.content?.author}
                    </Typography>
                )}
                {step?.content?.date && (
                    <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 'normal' }}
                    >
                        {moment(
                            step?.content?.date,
                            apiMobileDateFormat,
                        ).format('DD-MM-YYYY HH:mm:ss')}
                    </Typography>
                )}
            </>
        );
    }

    return (
        <Typography variant="body2">{step?.content?.description}</Typography>
    );
};

type Props = { id?: number; data?: ValidationNodeRetrieveResponse };

const styles: SxStyles = {
    avatar: {
        width: 24,
        height: 24,
        backgroundColor: theme => theme.palette.primary.main,
    },
};

const getIconFromStep = (status?: string, order?: number) => {
    switch (status) {
        case 'SUBMISSION':
        case 'NEW_VERSION':
            return (
                <Avatar sx={styles.avatar}>
                    <SendIcon sx={{ fontSize: '1rem' }} />
                </Avatar>
            );
        case 'SKIPPED':
            return (
                <Avatar sx={styles.avatar}>
                    <SkipNextIcon fontSize={'small'} />
                </Avatar>
            );
        default:
            return order;
    }
};

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
                    activeStep={validationTimeline
                        ?.slice()
                        ?.reverse()
                        ?.findIndex(step => step?.status === 'UNKNOWN')}
                    nonLinear
                    sx={{ margin: 'auto' }}
                >
                    {validationTimeline?.map(step => {
                        return (
                            <Step
                                key={`${step.label}-${step.status}-${step.content?.date}`}
                                expanded
                            >
                                <StepLabel
                                    icon={getIconFromStep(
                                        step?.status,
                                        step?.order,
                                    )}
                                    StepIconProps={{
                                        completed: step.status === 'ACCEPTED',
                                        error: step.status === 'REJECTED',
                                        sx: {
                                            color: step.color,
                                        },
                                    }}
                                >
                                    <Box>{step.label}</Box>
                                    <StepContent sx={{ fontWeight: 'normal' }}>
                                        {formatStepContent(step)}
                                        {step.canValidate && (
                                            <ValidateNodeModal
                                                key={step.nodeSlug}
                                                instanceId={id as number}
                                                nodeSlug={step.nodeSlug}
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
