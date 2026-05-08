import React from 'react';
import { Box, Typography } from '@mui/material';
import {
    ValidateNodeApproveByPassModal,
    ValidateNodeApproveModal,
    ValidateNodeRejectByPassModal,
    ValidateNodeRejectModal,
} from 'Iaso/domains/instances/components/ValidationWorkflow/ValidationModal';
import { Timeline } from 'Iaso/domains/instances/validationWorkflow/types/validationNodes';

type ListItemSecondaryTextProps = {
    timelineItem: Timeline;
    isMostRecent: boolean;
    instanceId: number;
};
export const ListItemSecondaryText = ({
    timelineItem,
    isMostRecent,
    instanceId,
}: ListItemSecondaryTextProps) => {
    if (
        isMostRecent &&
        (timelineItem.type === 'NEXT_BYPASS' ||
            timelineItem.status === 'UNKNOWN')
    ) {
        return (
            <>
                <Typography>PENDING</Typography>
                {timelineItem.user_can_do_actions &&
                    timelineItem.type !== 'NEXT_BYPASS' && (
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
                                    buttonText: 'Reject',
                                    color: 'error',
                                }}
                                instanceId={instanceId}
                            />
                            <ValidateNodeApproveModal
                                nodeId={timelineItem.id}
                                iconProps={{
                                    buttonText: 'Approve',
                                    color: 'success',
                                }}
                                instanceId={instanceId}
                            />
                        </Box>
                    )}
                {timelineItem.user_can_do_actions &&
                    timelineItem.type === 'NEXT_BYPASS' && (
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
                                    buttonText: 'Reject',
                                    color: 'error',
                                }}
                                instanceId={instanceId}
                            />
                            <ValidateNodeApproveByPassModal
                                nodeSlug={timelineItem.node_template_slug}
                                iconProps={{
                                    buttonText: 'Approve',
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
        return <Typography>Skipped</Typography>;
    } else {
        return (
            <>
                <Typography color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    By {timelineItem.updated_by} on {timelineItem.updated_at}
                </Typography>
                {timelineItem?.comment && (
                    <>
                        <Typography
                            fontWeight={'bold'}
                            component={'span'}
                            variant={'body2'}
                        >
                            Comment
                        </Typography>
                        <Typography component={'span'} variant={'body2'}>
                            : {timelineItem?.comment}
                        </Typography>
                    </>
                )}
            </>
        );
    }
};
