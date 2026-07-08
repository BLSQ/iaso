import React, { ReactNode, useCallback } from 'react';
import { Box, Typography } from '@mui/material';
import { useRedirectTo, useSafeIntl } from 'bluesquare-components';
import moment from 'moment';
import { baseUrls } from 'Iaso/constants/urls';
import {
    ValidateNodeApproveByPassModal,
    ValidateNodeApproveModal,
    ValidateNodeRejectByPassModal,
    ValidateNodeRejectModal,
} from 'Iaso/domains/instances/components/ValidationWorkflow/ValidationModal';
import { Timeline } from 'Iaso/domains/validationWorkflowsConfiguration/types/validationNodes';
import MESSAGES from '../../../messages';
import { ValidateButton } from '../ValidateButton';

type ListItemSecondaryTextProps = {
    timelineItem: Timeline;
    instanceId: number;
    isFirstSubmission: boolean;
};
export const ListItemSecondaryText = ({
    timelineItem,
    instanceId,
    isFirstSubmission,
}: ListItemSecondaryTextProps) => {
    const { formatMessage } = useSafeIntl();
    const canBypass =
        timelineItem.type === 'NEXT_BYPASS' && timelineItem.user_can_do_actions;
    const canValidate =
        timelineItem.status === 'UNKNOWN' && timelineItem.user_can_do_actions;
    const redirectTo = useRedirectTo();
    const goToReview = useCallback(() => {
        redirectTo(baseUrls.instanceValidation, {
            instanceId: `${instanceId}`,
            selectedStep: `${timelineItem.id}`,
        });
    }, [instanceId, redirectTo, timelineItem.id]);
    if (
        timelineItem.type === 'NEXT_STEP' ||
        (timelineItem.type === 'NEXT_BYPASS' &&
            !timelineItem.user_can_do_actions)
    ) {
        return;
    }
    if (!isFirstSubmission && (canBypass || canValidate)) {
        return (
            <>
                <Typography sx={{ textTransform: 'uppercase' }}>
                    {formatMessage(MESSAGES.pending)}
                </Typography>
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        my: 1,
                        pr: 2,
                        flexWrap: 'wrap',
                    }}
                >
                    <ValidateButton
                        buttonText={formatMessage(MESSAGES.review)}
                        onClick={goToReview}
                    />
                </Box>
            </>
        );
    }

    if (canBypass && isFirstSubmission) {
        return (
            <>
                <Typography sx={{ textTransform: 'uppercase' }}>
                    {formatMessage(MESSAGES.pending)}
                </Typography>
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        my: 1,
                        pr: 2,
                        flexWrap: 'wrap',
                    }}
                >
                    <ValidateNodeRejectByPassModal
                        nodeSlug={timelineItem.node_template_slug}
                        iconProps={{
                            buttonText: formatMessage(MESSAGES.reject),
                            color: 'error',
                        }}
                        instanceId={instanceId}
                    />
                    <ValidateNodeApproveByPassModal
                        nodeSlug={timelineItem.node_template_slug}
                        iconProps={{
                            buttonText: formatMessage(MESSAGES.approve),
                            color: 'success',
                        }}
                        instanceId={instanceId}
                    />
                </Box>
            </>
        );
    }

    if (timelineItem.status === 'UNKNOWN' && isFirstSubmission) {
        return (
            <>
                <Typography sx={{ textTransform: 'uppercase' }}>
                    {formatMessage(MESSAGES.pending)}
                </Typography>
                {timelineItem.user_can_do_actions && (
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            my: 1,
                            pr: 2,
                            flexWrap: 'wrap',
                        }}
                    >
                        <ValidateNodeRejectModal
                            nodeId={timelineItem.id}
                            iconProps={{
                                buttonText: formatMessage(MESSAGES.reject),
                                color: 'error',
                            }}
                            instanceId={instanceId}
                        />
                        <ValidateNodeApproveModal
                            nodeId={timelineItem.id}
                            iconProps={{
                                buttonText: formatMessage(MESSAGES.approve),
                                color: 'success',
                            }}
                            instanceId={instanceId}
                        />
                    </Box>
                )}
            </>
        );
    }

    if (timelineItem.status === 'SKIPPED') {
        return (
            <Typography sx={{ textTransform: 'uppercase' }}>
                {formatMessage(MESSAGES.skipped)}
            </Typography>
        );
    }
    return (
        <>
            <Typography color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                {formatMessage(MESSAGES.validationTimelineByOn, {
                    user: timelineItem.updated_by as string,
                    date: moment(timelineItem.updated_at).format(
                        'YYYY-MM-DD HH:mm:ss',
                    ),
                })}
            </Typography>
            {timelineItem?.comment &&
                formatMessage(MESSAGES.validationTimelineComment, {
                    firstTag: (chunks: ReactNode[]) => (
                        <Typography
                            fontWeight={'bold'}
                            component={'span'}
                            variant={'body2'}
                        >
                            {chunks}
                        </Typography>
                    ),
                    secondTag: (chunks: ReactNode[]) => (
                        <Typography component={'span'} variant={'body2'}>
                            {chunks}
                        </Typography>
                    ),
                    comment: timelineItem.comment,
                })}
        </>
    );
};
