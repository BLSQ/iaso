import React, { FunctionComponent } from 'react';
import SendIcon from '@mui/icons-material/Send';
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
import { ValidationNodeRetrieveResponse } from 'Iaso/domains/validationWorkflowsConfiguration/types/validationNodes';
import { apiMobileDateFormat } from 'Iaso/utils/dates';
import MESSAGES from '../../messages';
import { useGetNodesList } from './useGetSubmissionValidationStatus';
import {
    useValidationTimeline,
    UseValidationTimelineResult,
} from './useValidationTimeline';
import { ValidateNodeModal } from './ValidationModal';

const timelineContentSx = {
    mt: 1,
    ml: 1,
    px: 2,
    py: 1.5,
    display: 'flex',
    gap: 2,
    alignItems: 'stretch',
    border: '1px solid rgba(0, 0, 0, 0.18)',
    borderRadius: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
};

const timelineBodySx = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 1.5,
};

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
                                    icon={
                                        ['NEW_VERSION', 'SUBMISSION'].includes(
                                            step?.status ?? '',
                                        ) ? (
                                            <SendIcon fontSize={'small'} />
                                        ) : (
                                            step?.order
                                        )
                                    }
                                    StepIconProps={{
                                        completed: step.status === 'ACCEPTED',
                                        error: step.status === 'REJECTED',
                                        sx: {
                                            color: step.color,
                                        },
                                    }}
                                >
                                    <Box>{step.label}</Box>
                                    <StepContent
                                        sx={{
                                            fontWeight: 'normal',
                                            borderLeft: 'none',
                                            marginLeft: 0,
                                            paddingLeft: 0,
                                            paddingRight: 0,
                                        }}
                                    >
                                        <Box sx={timelineContentSx}>
                                            <Box sx={timelineBodySx}>
                                                {formatStepContent(step)}
                                                {step.canValidate && (
                                                    <Box
                                                        sx={{
                                                            display: 'flex',
                                                            justifyContent:
                                                                'flex-end',
                                                            pt: 1,
                                                            borderTop:
                                                                '1px solid rgba(0, 0, 0, 0.2)',
                                                        }}
                                                    >
                                                        <ValidateNodeModal
                                                            key={step.nodeSlug}
                                                            instanceId={
                                                                id as number
                                                            }
                                                            nodeSlug={
                                                                step.nodeSlug
                                                            }
                                                            nodeId={step.nodeId}
                                                            iconProps={{
                                                                buttonText: `${formatMessage(MESSAGES.validate)}`,
                                                                size: 'medium',
                                                            }}
                                                        />
                                                    </Box>
                                                )}
                                            </Box>
                                        </Box>
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
