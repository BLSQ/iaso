import React from 'react';
import CheckIcon from '@mui/icons-material/Check';
import ClearIcon from '@mui/icons-material/Clear';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import { Avatar } from '@mui/material';
import { Timeline } from 'Iaso/domains/validationWorkflowsConfiguration/types/validationNodes';

type AvatarTimelineProps = {
    userCanDoActions: Timeline['user_can_do_actions'];
} & Pick<Timeline, 'status' | 'type'>;

export const AvatarTimeline = ({
    status,
    type,
    userCanDoActions,
}: AvatarTimelineProps) => {
    if (type === 'NEXT_BYPASS' && userCanDoActions) {
        return (
            <Avatar sx={{ bgcolor: 'background.warning' }}>
                <MoreHorizIcon />
            </Avatar>
        );
    } else if (type === 'NEXT_BYPASS' || type === 'NEXT_STEP') {
        return (
            <Avatar data-testid={'next-step'}>
                <MoreHorizIcon />
            </Avatar>
        );
    } else {
        switch (status) {
            case 'REJECTED':
                return (
                    <Avatar sx={{ bgcolor: 'background.error' }}>
                        <ClearIcon />
                    </Avatar>
                );
            case 'ACCEPTED':
                return (
                    <Avatar sx={{ bgcolor: 'background.success' }}>
                        <CheckIcon />
                    </Avatar>
                );
            case 'SKIPPED':
                return (
                    <Avatar>
                        <SkipNextIcon />
                    </Avatar>
                );
            case 'UNKNOWN':
                return (
                    <Avatar sx={{ bgcolor: 'background.warning' }}>
                        <MoreHorizIcon />
                    </Avatar>
                );
        }
    }
};
